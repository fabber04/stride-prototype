// The server backend. One endpoint (POST /api/rpc) takes { method, args } plus a bearer token,
// runs the same rules as the local backend, saves only the rows that changed, and sends back
// the slice of the database the signed-in user may see.
import { ApiError, applyMethod, methodNames } from '../src/api/rules.js';
import { collections, createSeed } from '../src/api/seed.js';
import { hashPassword, hashToken, newToken, verifyPassword } from './passwords.js';
import { visibleTo } from './visibility.js';

const SESSION_DAYS = 30;
const allowed = new Set(methodNames);

/** Rows to write and ids to delete, per collection. */
export function diff(prev, next) {
  const changes = {};
  for (const name of collections) {
    const before = prev[name] || {};
    const after = next[name] || {};
    const upsert = [];
    const remove = [];
    for (const [id, row] of Object.entries(after)) {
      if (!before[id] || JSON.stringify(before[id]) !== JSON.stringify(row)) upsert.push(row);
    }
    for (const id of Object.keys(before)) if (!after[id]) remove.push(id);
    if (upsert.length || remove.length) changes[name] = { upsert, remove };
  }
  return changes;
}

/**
 * @param {object} options
 * @param {object} options.store       memory-store.js or supabase-store.js
 * @param {() => Date} [options.now]
 * @param {boolean} [options.allowReset] let anyone reseed the demo (STRIDE_ALLOW_RESET=true)
 */
export function createHandler({ store, now = () => new Date(), allowReset = false }) {
  async function loadDb() {
    const db = await store.load();
    if (db) return db;
    // First run: fill in the demo. Upsert only, never delete, so two requests seeding at the
    // same moment write the same rows instead of wiping each other's work.
    const seeded = createSeed(now(), hashPassword);
    await store.fillMissing(seeded);
    return (await store.load()) || seeded;
  }

  async function sessionUser(db, token) {
    if (!token) return null;
    const userId = await store.getSession(hashToken(token));
    return userId && db.users[userId] ? userId : null;
  }

  const reply = (db, userId, extra = {}) => ({
    status: 200,
    body: { ...extra, snapshot: { db: visibleTo(db, userId), session: userId ? { userId } : null } }
  });

  async function startSession(userId) {
    const token = newToken();
    const expires = new Date(now().getTime() + SESSION_DAYS * 86400000).toISOString();
    await store.createSession(hashToken(token), userId, expires);
    return token;
  }

  return async function handle({ method, args = [], token } = {}) {
    try {
      const db = await loadDb();
      const userId = await sessionUser(db, token);

      if (method === 'snapshot') return reply(db, userId);
      if (method === 'health') {
        const counts = Object.fromEntries(collections.map((c) => [c, Object.keys(db[c] || {}).length]));
        return { status: 200, body: { ok: true, counts } };
      }

      if (method === 'resetDemo') {
        if (!allowReset) throw new ApiError('Resetting the demo is turned off on this server.');
        const seeded = createSeed(now(), hashPassword);
        await store.replaceAll(seeded);
        await store.deleteAllSessions();
        return reply(seeded, null, { value: null, token: null });
      }

      if (!allowed.has(method)) throw new ApiError(`Unknown action: ${method}`, 400);
      const next = structuredClone(db);
      const result = applyMethod(next, method, Array.isArray(args) ? args : [args], {
        userId,
        now: now(),
        hash: hashPassword,
        verify: verifyPassword
      });
      const changes = diff(db, next);
      if (Object.keys(changes).length) await store.saveChanges(changes);

      if (result.session === undefined) return reply(next, userId, { value: result.value });
      if (token) await store.deleteSession(hashToken(token));
      const nextUser = result.session ? result.session.userId : null;
      const nextToken = nextUser ? await startSession(nextUser) : null;
      return reply(next, nextUser, { value: result.value, token: nextToken });
    } catch (error) {
      if (error instanceof ApiError) return { status: error.status, body: { error: error.message } };
      console.error('[stride] rpc failed', method, error);
      return { status: 500, body: { error: 'Something went wrong on our side. Try again in a moment.' } };
    }
  };
}
