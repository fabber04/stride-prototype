import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalBackend, memoryStorage } from './local.js';
import { clubStatus, isMember, streak, taskFor, tasksToReview, thread, weekHistory } from './selectors.js';

// Tuesday 10 Nov 2026, 12:00
const NOW = new Date(2026, 10, 10, 12, 0);

let api;
const db = () => api.getSnapshot().db;
const me = () => api.getSnapshot().session?.userId;
const asTino = () => api.signIn({ login: 'tino', secret: '1234' });
const asChiedza = () => api.signIn({ login: 'chiedza@example.com', secret: 'stride' });
const asTendai = () => api.signIn({ login: 'tendai@example.com', secret: 'stride' });
const asMentor = (id) => api.signIn({ login: id, secret: 'stride' });

beforeEach(() => {
  api = createLocalBackend({ storage: memoryStorage(), now: () => NOW });
});

describe('accounts', () => {
  it('signs in each role, case-insensitively', async () => {
    await api.signIn({ login: 'TINO', secret: '1234' });
    expect(me()).toBe('t_tino');
    await asChiedza();
    expect(me()).toBe('g_chiedza');
    await asMentor('fabulous');
    expect(db().users[me()].role).toBe('mentor');
    await asMentor('farai');
    expect(db().users[me()].mentorId).toBe('farai');
    await api.signOut();
    expect(me()).toBeUndefined();
  });

  it('refuses a wrong PIN', async () => {
    await expect(api.signIn({ login: 'tino', secret: '0000' })).rejects.toThrow(/don't match/);
    expect(me()).toBeUndefined();
  });

  it('lets a guardian register, create a teen, and the teen sign in with the PIN', async () => {
    await api.registerGuardian({ name: 'Nyasha Banda', contact: 'nyasha@example.com', relation: 'Aunt or uncle', password: 'secret1', verifiedBy: 'id', verifiedAt: NOW.toISOString() });
    const guardianId = me();
    expect(db().users[guardianId].role).toBe('guardian');
    const teenId = await api.createTeen({ name: 'Nyari', dob: '2012-05-01', login: 'Nyari', pin: '4321', consent: { clubs: true, mentor: false, messages: true } });
    const teen = db().users[teenId];
    expect(teen.login).toBe('nyari');
    expect(teen.guardianId).toBe(guardianId);
    expect(teen.consent.messages).toBe(false); // no messages without a mentor
    expect(teen.consentLog).toHaveLength(1);
    await api.handOver(teenId);
    expect(me()).toBe(teenId);
    await api.updateTeenProfile({ nickname: 'Nyari', interests: ['Arts'], goal: 3 });
    expect(db().users[teenId].goal).toBe(3);
    await api.signOut();
    await api.signIn({ login: 'nyari', secret: '4321' });
    expect(me()).toBe(teenId);
  });

  it('refuses short passwords, taken contacts and bad PINs', async () => {
    await expect(api.registerGuardian({ name: 'A', contact: 'a@example.com', password: '123' })).rejects.toThrow(/6 or more/);
    await expect(api.registerGuardian({ name: 'A', contact: 'Chiedza@example.com', password: '123456' })).rejects.toThrow(/already has an account/);
    await asChiedza();
    await expect(api.createTeen({ name: 'Zoe', dob: '2012-01-01', login: 'zoe', pin: '12' })).rejects.toThrow(/4 digits/);
    await expect(api.createTeen({ name: 'Zoe', dob: '2012-01-01', login: 'tino', pin: '1234' })).rejects.toThrow(/taken/);
  });

  it('refuses an age outside 12 to 17', async () => {
    await asChiedza();
    await expect(api.createTeen({ name: 'Tiny', dob: '2016-01-01', login: 'tiny', pin: '1111' })).rejects.toThrow(/12 to 17/);
    await expect(api.createTeen({ name: 'Adult', dob: '2005-01-01', login: 'adult', pin: '1111' })).rejects.toThrow(/12 to 17/);
  });

  it('auto-matches a mentor from interests', async () => {
    await asChiedza();
    const id = await api.createTeen({ name: 'Zoe', dob: '2012-01-01', login: 'zoe', pin: '1111', consent: {} });
    await api.handOver(id);
    await api.updateTeenProfile({ interests: ['Study'] });
    expect(db().users[id].mentorId).toBe('eric');
  });

  it("only lets a teen's own guardian change their settings or delete them", async () => {
    await asTendai();
    await expect(api.setConsent('t_tino', { clubs: false })).rejects.toThrow(/own guardian/);
    await expect(api.deleteTeen('t_tino')).rejects.toThrow(/own guardian/);
    await asChiedza();
    await api.setConsent('t_tino', { mentor: false }, 'Turned off: A checked mentor');
    expect(db().users.t_tino.consent).toMatchObject({ mentor: false, messages: false, account: true });
    await api.resetTeenPin('t_tino', '9999');
    await api.deleteTeen('t_rudo');
    expect(db().users.t_rudo).toBeUndefined();
    expect(Object.values(db().memberships).some((m) => m.teenId === 't_rudo')).toBe(false);
  });
});

describe('club requests', () => {
  it("lets only the teen's own guardian approve, which adds the club, and pending reverts it", async () => {
    await asTino();
    const id = await api.requestClub('robotics');
    expect(clubStatus(db(), 't_tino', 'robotics')).toBe('pending');
    await asTendai();
    await expect(api.decideRequest(id, 'approved')).rejects.toThrow(/own guardian/);
    await asChiedza();
    await api.decideRequest(id, 'approved');
    expect(isMember(db(), 't_tino', 'robotics')).toBe(true);
    await api.decideRequest(id, 'pending');
    expect(isMember(db(), 't_tino', 'robotics')).toBe(false);
    await api.decideRequest(id, 'declined');
    expect(clubStatus(db(), 't_tino', 'robotics')).toBe('declined');
  });

  it('returns the existing pending request and lets the teen cancel it', async () => {
    await asTino();
    expect(await api.requestClub('coders')).toBe('r_tino_coders');
    await api.cancelRequest('r_tino_coders');
    expect(clubStatus(db(), 't_tino', 'coders')).toBe(null);
    await expect(api.requestClub('football')).rejects.toThrow(/already in/);
  });

  it('blocks requests when paused or when clubs consent is off', async () => {
    await asChiedza();
    await api.setTeenLimits('t_tino', { paused: true });
    await asTino();
    await expect(api.requestClub('robotics')).rejects.toThrow(/paused/);
    await asChiedza();
    await api.setTeenLimits('t_tino', { paused: false });
    await api.setConsent('t_tino', { clubs: false });
    await asTino();
    await expect(api.requestClub('robotics')).rejects.toThrow(/club requests/);
  });
});

describe('attendance and tasks', () => {
  it('only lets the club leader mark attendance, and not in the future', async () => {
    await asMentor('fabulous');
    await expect(api.setAttendance({ teenId: 't_tino', clubId: 'football', date: '2026-11-07', present: true })).rejects.toThrow(/club leader/);
    await asMentor('farai');
    await expect(api.setAttendance({ teenId: 't_rudo', clubId: 'football', date: '2026-11-07', present: true })).rejects.toThrow(/not in this club/);
    await expect(api.setAttendance({ teenId: 't_tino', clubId: 'football', date: '2026-11-14', present: true })).rejects.toThrow(/hasn't happened/);
    await api.setAttendance({ teenId: 't_tino', clubId: 'football', date: '2026-11-07', present: false });
    expect(db().attendance['a_t_tino_football_2026-11-07']).toBeUndefined();
    await api.setAttendance({ teenId: 't_tino', clubId: 'football', date: '2026-11-07', present: true });
    expect(db().attendance['a_t_tino_football_2026-11-07'].confirmedBy).toBe('farai');
  });

  it('runs a task from steps to badge; sending back needs a note', async () => {
    await asTino();
    await expect(api.submitTask('python')).rejects.toThrow(/steps/);
    await api.saveSteps('python', { 0: true, 1: true });
    await expect(api.submitTask('python')).rejects.toThrow(/every step/);
    await api.saveSteps('python', { 0: true, 1: true, 2: true });
    await api.submitTask('python');
    await expect(api.saveSteps('python', {})).rejects.toThrow(/Take your task back/);
    const taskId = taskFor(db(), 't_tino', 'python').id;

    await asMentor('simba');
    await expect(api.reviewTask(taskId, { approve: true })).rejects.toThrow(/lesson mentor or club leader/);
    await asMentor('fabulous');
    expect(tasksToReview(db(), 'fabulous').map((t) => t.id)).toContain(taskId);
    await expect(api.reviewTask(taskId, { approve: false, note: ' ' })).rejects.toThrow(/note/);
    await api.reviewTask(taskId, { approve: false, note: 'Add one more question.' });
    expect(db().tasks[taskId]).toMatchObject({ status: 'returned', note: 'Add one more question.' });

    await asTino();
    await api.submitTask('python');
    await asMentor('fabulous');
    await api.reviewTask(taskId, { approve: true });
    expect(db().tasks[taskId].status).toBe('confirmed');
    expect(Object.values(db().badges).find((b) => b.teenId === 't_tino' && b.lessonId === 'python')).toMatchObject({ name: 'Builder', mentorId: 'fabulous' });
  });

  it("does not let mentors edit other mentors' lessons", async () => {
    await asMentor('farai');
    await expect(api.saveLesson({ id: 'python', title: 'Mine now', task: 'x', steps: ['a'], badge: 'b' })).rejects.toThrow(/your own lessons/);
    await expect(api.deleteLesson('python')).rejects.toThrow(/your own lessons/);
    await expect(api.saveLesson({ title: 'Passing', task: 'x', steps: ['a'], badge: 'b', club: 'coders' })).rejects.toThrow(/club you lead/);
    await expect(api.saveLesson({ title: 'Passing', task: 'x', steps: [], badge: 'b' })).rejects.toThrow(/one step/);
    const id = await api.saveLesson({ title: 'Passing drills', type: 'Sport', club: 'football', task: 'Pass 50 times', steps: ['Watch', 'Practise'], badge: 'Playmaker' });
    expect(db().lessons[id]).toMatchObject({ mentorId: 'farai', club: 'football', badge: 'Playmaker' });
  });
});

describe('messages', () => {
  it('blocks messages both ways when consent is off', async () => {
    await asChiedza();
    await api.setConsent('t_tino', { messages: false });
    await asTino();
    await expect(api.sendMessage({ teenId: 't_tino', mentorId: 'fabulous', text: 'Hi' })).rejects.toThrow(/turned off messages/);
    await asMentor('fabulous');
    await expect(api.sendMessage({ teenId: 't_tino', mentorId: 'fabulous', text: 'Hi' })).rejects.toThrow(/turned off messages/);
  });

  it('lets guardians read but not send', async () => {
    await asChiedza();
    expect(thread(db(), 't_tino', 'fabulous').length).toBeGreaterThan(0);
    await expect(api.sendMessage({ teenId: 't_tino', mentorId: 'fabulous', text: 'Hello' })).rejects.toThrow(/can't send/);
    await api.markThreadRead('t_tino', 'fabulous');
    expect(thread(db(), 't_tino', 'fabulous').some((m) => !m.readAt)).toBe(true);
  });

  it('lets mentors message only teens they are connected to, and marks threads read', async () => {
    await asMentor('chipo');
    await expect(api.sendMessage({ teenId: 't_tino', mentorId: 'chipo', text: 'Hi' })).rejects.toThrow(/mentees/);
    await asMentor('farai');
    await api.sendMessage({ teenId: 't_tino', mentorId: 'farai', text: 'Great training on Saturday!' });
    await asTino();
    await api.sendMessage({ teenId: 't_tino', mentorId: 'eric', text: 'Hi Eric' });
    await api.markThreadRead('t_tino', 'fabulous');
    expect(thread(db(), 't_tino', 'fabulous').every((m) => m.readAt)).toBe(true);
  });

  it('files a report only with a reason', async () => {
    await asTino();
    await expect(api.fileReport({ mentorId: 'fabulous', reason: '' })).rejects.toThrow(/what happened/);
    await api.fileReport({ mentorId: 'fabulous', reason: 'Something else', text: '' });
    expect(Object.values(db().reports)).toHaveLength(1);
  });
});

describe('seed', () => {
  it("gives Tino a 2-week streak", () => {
    const tino = db().users.t_tino;
    expect(streak(db(), tino, NOW)).toBe(2);
    const history = weekHistory(db(), tino, 8, NOW);
    expect(history).toHaveLength(9);
    expect(history.at(-1)).toMatchObject({ current: true, count: 0 });
  });

  it('resets the demo and signs out', async () => {
    await asTino();
    await api.requestClub('robotics');
    await api.resetDemo();
    expect(me()).toBeUndefined();
    expect(clubStatus(db(), 't_tino', 'robotics')).toBe(null);
  });
});
