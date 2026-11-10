import { beforeEach, describe, expect, it } from 'vitest';
import { createHandler, diff } from './handler.js';
import { createMemoryStore } from './memory-store.js';
import { fromRow, toRow } from './schema.js';
import { createSeed } from '../src/api/seed.js';

const NOW = new Date(2026, 10, 10, 12, 0);
let handle;
let store;

async function signIn(login, secret) {
  const res = await handle({ method: 'signIn', args: [{ login, secret }] });
  expect(res.status).toBe(200);
  return res.body.token;
}

beforeEach(() => {
  store = createMemoryStore();
  handle = createHandler({ store, now: () => NOW });
});

describe('server handler', () => {
  it('seeds an empty database with salted hashes and never sends secrets', async () => {
    const res = await handle({ method: 'snapshot' });
    expect(res.status).toBe(200);
    expect(res.body.snapshot.session).toBe(null);
    expect(Object.keys(res.body.snapshot.db.users)).toHaveLength(0);
    expect(Object.keys(res.body.snapshot.db.clubs)).toHaveLength(7);
    const saved = await store.load();
    expect(saved.users.t_tino.secret).toMatch(/^scrypt\$/);

    const token = await signIn('chiedza@example.com', 'stride');
    const mine = await handle({ method: 'snapshot', token });
    expect(Object.values(mine.body.snapshot.db.users).some((u) => 'secret' in u)).toBe(false);
  });

  it('issues a token on sign-in and drops it on sign-out', async () => {
    const token = await signIn('tino', '1234');
    expect(token).toBeTruthy();
    const me = await handle({ method: 'snapshot', token });
    expect(me.body.snapshot.session).toEqual({ userId: 't_tino' });
    const out = await handle({ method: 'signOut', token });
    expect(out.body.token).toBe(null);
    const after = await handle({ method: 'snapshot', token });
    expect(after.body.snapshot.session).toBe(null);
  });

  it('refuses a wrong password with 401', async () => {
    const res = await handle({ method: 'signIn', args: [{ login: 'tino', secret: '9999' }] });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/don't match/);
  });

  it("sends a guardian only their own family's rows", async () => {
    const token = await signIn('tendai@example.com', 'stride');
    const { db } = (await handle({ method: 'snapshot', token })).body.snapshot;
    expect(db.users.t_tino).toBeUndefined();
    expect(db.users.t_ropa).toBeDefined();
    expect(Object.values(db.messages).every((m) => ['t_ropa', 't_kuda', 't_tapiwa', 't_farai'].includes(m.teenId))).toBe(true);
    expect(Object.values(db.requests).some((r) => r.teenId === 't_tino')).toBe(false);
  });

  it('shows mentors nicknames only, and only their teens', async () => {
    const token = await signIn('fabulous', 'stride');
    const { db } = (await handle({ method: 'snapshot', token })).body.snapshot;
    expect(db.users.t_tino.surname).toBeUndefined();
    expect(db.users.t_tino.dob).toBeUndefined();
    expect(db.users.t_ropa).toBeDefined(); // member of Junior Coders
    expect(db.users.t_rudo).toBeUndefined();
    expect(Object.values(db.messages).every((m) => m.mentorId === 'fabulous')).toBe(true);
  });

  it('runs the same rules as the local backend and saves the change', async () => {
    const tino = await signIn('tino', '1234');
    const asked = await handle({ method: 'requestClub', args: ['robotics'], token: tino });
    expect(asked.status).toBe(200);
    const chiedza = await signIn('chiedza@example.com', 'stride');
    const tendai = await signIn('tendai@example.com', 'stride');
    const refused = await handle({ method: 'decideRequest', args: [asked.body.value, 'approved'], token: tendai });
    expect(refused.status).toBe(403);
    await handle({ method: 'decideRequest', args: [asked.body.value, 'approved'], token: chiedza });
    const saved = await store.load();
    expect(Object.values(saved.memberships).some((m) => m.teenId === 't_tino' && m.clubId === 'robotics')).toBe(true);
  });

  it('switches the token to the teen on hand-over', async () => {
    const reg = await handle({ method: 'registerGuardian', args: [{ name: 'Nyasha Banda', contact: 'nb@example.com', password: 'secret1' }] });
    const teenId = (await handle({ method: 'createTeen', args: [{ name: 'Nyari', dob: '2012-05-01', login: 'nyari', pin: '4321' }], token: reg.body.token })).body.value;
    const handed = await handle({ method: 'handOver', args: [teenId], token: reg.body.token });
    expect(handed.body.snapshot.session.userId).toBe(teenId);
    const guardianNow = await handle({ method: 'snapshot', token: reg.body.token });
    expect(guardianNow.body.snapshot.session).toBe(null);
    expect(await signIn('nyari', '4321')).toBeTruthy();
  });

  it('only resets the demo when allowed', async () => {
    expect((await handle({ method: 'resetDemo' })).status).toBe(403);
    const open = createHandler({ store, now: () => NOW, allowReset: true });
    expect((await open({ method: 'resetDemo' })).status).toBe(200);
  });

  it('rejects unknown methods', async () => {
    expect((await handle({ method: 'constructor' })).status).toBe(400);
  });
});

describe('storage mapping', () => {
  it('round-trips every row through the Postgres column mapping', () => {
    const db = createSeed(NOW);
    for (const table of ['users', 'mentors', 'clubs', 'lessons', 'attendance', 'tasks', 'messages', 'badges']) {
      for (const obj of Object.values(db[table])) {
        const clean = JSON.parse(JSON.stringify(obj, (k, v) => (v === null ? undefined : v)));
        expect(fromRow(table, toRow(table, obj))).toEqual(clean);
      }
    }
    expect(toRow('messages', db.messages.msg_1)).toHaveProperty('sender', 'mentor');
  });

  it('diffs only changed rows', () => {
    const a = createSeed(NOW);
    const b = structuredClone(a);
    b.users.t_tino.goal = 3;
    delete b.requests.r_tino_coders;
    expect(diff(a, b)).toEqual({ users: { upsert: [b.users.t_tino], remove: [] }, requests: { upsert: [], remove: ['r_tino_coders'] } });
  });
});

describe('seeding', () => {
  it('survives two requests seeding an empty database at once', async () => {
    const [a, b] = await Promise.all([handle({ method: 'snapshot' }), handle({ method: 'snapshot' })]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const health = await handle({ method: 'health' });
    expect(health.body.counts).toMatchObject({ clubs: 7, lessons: 6 });
    expect(health.body.counts.users).toBeGreaterThan(10);
  });

  it('fills in a half-finished seed without touching existing rows', async () => {
    await handle({ method: 'snapshot' });
    const token = await signIn('tino', '1234');
    await handle({ method: 'updateTeenProfile', args: [{ goal: 3 }], token });
    const saved = await store.load();
    delete saved.clubs.football;
    await store.replaceAll(saved);
    await store.fillMissing(createSeed(NOW));
    const after = await store.load();
    expect(after.clubs.football).toBeDefined();
    expect(after.users.t_tino.goal).toBe(3);
  });
});
