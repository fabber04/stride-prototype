// Every write and its access rules, in one place. Both backends run this same code:
// the local backend in the browser (src/api/local.js) and the server backend (server/handler.js),
// which keeps the database in Supabase. local.test.js is the spec for these rules.
import { categories } from '../data.js';
import { MAX_AGE, MIN_AGE, POLICY_VERSION, ageFrom, defaultConsent } from '../onboarding.js';
import { isoDate } from './dates.js';
import { teenColors } from './seed.js';

export class ApiError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const check = (condition, message, status) => {
  if (!condition) throw new ApiError(message, status);
};

const LOGIN_RE = /^[a-z0-9_.]{3,20}$/;
const PIN_RE = /^\d{4}$/;
const categoryIds = categories.map((c) => c.id);

export const methodNames = [
  'signIn', 'signOut', 'registerGuardian', 'createTeen', 'handOver', 'updateTeenProfile', 'setTeenLimits',
  'setConsent', 'resetTeenPin', 'deleteTeen', 'requestClub', 'cancelRequest', 'decideRequest', 'setAttendance',
  'saveSteps', 'submitTask', 'withdrawTask', 'reviewTask', 'saveLesson', 'deleteLesson', 'sendMessage',
  'markThreadRead', 'fileReport'
];

const values = (collection) => Object.values(collection || {});
const loginTaken = (db, login) => values(db.users).some((u) => u.login === login);

// Career interest -> Charlene, Study without Tech -> Eric, everyone else -> Fabulous.
export function matchMentor(interests = []) {
  if (interests.includes('Career')) return 'charlene';
  if (interests.includes('Study') && !interests.includes('Tech')) return 'eric';
  return 'fabulous';
}

function autoMatch(teen) {
  if (!teen.mentorId && teen.consent.mentor && teen.interests.length > 0) teen.mentorId = matchMentor(teen.interests);
}

function normaliseConsent(consent) {
  const next = { ...defaultConsent, ...consent, account: true };
  if (!next.mentor) next.messages = false;
  for (const key of Object.keys(next)) next[key] = !!next[key];
  return next;
}

function removeTeenRows(db, teenId) {
  for (const name of ['memberships', 'requests', 'attendance', 'tasks', 'badges', 'messages', 'reports']) {
    for (const row of values(db[name])) if (row.teenId === teenId) delete db[name][row.id];
  }
  delete db.users[teenId];
}

function canReview(db, mentorId, lesson) {
  if (!lesson) return false;
  return lesson.mentorId === mentorId || db.clubs[lesson.club]?.mentorId === mentorId;
}

// Mentees, members of clubs they lead, and anyone they already have a thread with.
export function mentorCanReach(db, mentorId, teen) {
  if (teen.mentorId === mentorId) return true;
  const led = new Set(values(db.clubs).filter((c) => c.mentorId === mentorId).map((c) => c.id));
  if (values(db.memberships).some((m) => m.teenId === teen.id && led.has(m.clubId))) return true;
  return values(db.messages).some((m) => m.teenId === teen.id && m.mentorId === mentorId);
}

const methods = {
  signIn(db, c, { login, secret } = {}) {
    const key = String(login || '').trim().toLowerCase();
    const user = values(db.users).find((u) => u.login === key);
    check(user && c.verify(String(secret || ''), user.secret), "That username and PIN or password don't match.", 401);
    c.signInAs(user.id);
    return user.id;
  },

  signOut(db, c) {
    c.signInAs(null);
    return null;
  },

  registerGuardian(db, c, { name, contact, relation, password, verifiedBy, verifiedAt } = {}) {
    const cleanName = String(name || '').trim();
    const login = String(contact || '').trim().toLowerCase();
    check(cleanName, 'Add your name.', 400);
    check(login, 'Add a phone number or email.', 400);
    check(String(password || '').length >= 6, 'Use a password with 6 or more characters.', 400);
    check(!loginTaken(db, login), 'That phone number or email already has an account. Sign in instead.', 409);
    const id = c.id('g');
    db.users[id] = {
      id, role: 'guardian', login, secret: c.hash(password), name: cleanName, createdAt: c.nowIso,
      contact: String(contact).trim(), relation: relation || '', verifiedBy: verifiedBy || null, verifiedAt: verifiedAt || null
    };
    c.signInAs(id);
    return id;
  },

  createTeen(db, c, { name, dob, login, pin, consent, quietHours = true } = {}) {
    const guardian = c.requireRole('guardian');
    const cleanName = String(name || '').trim();
    const cleanLogin = String(login || '').trim().toLowerCase();
    const age = ageFrom(dob, c.now);
    check(cleanName, 'Add their first name.', 400);
    check(age !== null && age >= MIN_AGE && age <= MAX_AGE, `Stride teen accounts are for ${MIN_AGE} to ${MAX_AGE} year olds.`, 400);
    check(LOGIN_RE.test(cleanLogin), 'Usernames are 3 to 20 letters, numbers, dots or underscores.', 400);
    check(!loginTaken(db, cleanLogin), 'That username is taken. Try another.', 409);
    check(PIN_RE.test(String(pin || '')), 'The PIN must be 4 digits.', 400);
    const choices = normaliseConsent(consent);
    const id = c.id('t');
    const count = values(db.users).filter((u) => u.guardianId === guardian.id).length;
    db.users[id] = {
      id, role: 'teen', login: cleanLogin, secret: c.hash(String(pin)), name: cleanName, createdAt: c.nowIso,
      surname: guardian.name.split(' ').slice(1).join(' '), nickname: cleanName, dob, guardianId: guardian.id, mentorId: null,
      color: teenColors[count % teenColors.length], interests: [], goal: 2, routine: { Sun: { label: 'Family', icon: 'home' } },
      paused: false, quietHours: !!quietHours, consent: choices,
      consentLog: [{ at: c.nowIso, by: guardian.name, version: POLICY_VERSION, choices, note: 'Initial consent' }]
    };
    return id;
  },

  handOver(db, c, teenId) {
    c.requireGuardianOf(teenId);
    c.signInAs(teenId);
    return teenId;
  },

  updateTeenProfile(db, c, { nickname, interests, goal } = {}) {
    const teen = c.requireRole('teen');
    if (nickname !== undefined) {
      const clean = String(nickname).trim().slice(0, 20);
      check(clean, 'Add a nickname.', 400);
      teen.nickname = clean;
    }
    if (interests !== undefined) teen.interests = [...new Set(interests)].filter((i) => categoryIds.includes(i));
    if (goal !== undefined) {
      check([1, 2, 3].includes(Number(goal)), 'Pick 1, 2 or 3 sessions a week.', 400);
      teen.goal = Number(goal);
    }
    autoMatch(teen);
    return teen.id;
  },

  setTeenLimits(db, c, teenId, { paused, quietHours } = {}) {
    const { guardian, teen } = c.requireGuardianOf(teenId);
    const notes = [];
    if (paused !== undefined && !!paused !== teen.paused) {
      teen.paused = !!paused;
      notes.push(paused ? 'Paused the account' : 'Turned the account back on');
    }
    if (quietHours !== undefined && !!quietHours !== teen.quietHours) {
      teen.quietHours = !!quietHours;
      notes.push(quietHours ? 'Turned on quiet hours' : 'Turned off quiet hours');
    }
    for (const note of notes) {
      teen.consentLog.push({ at: c.nowIso, by: guardian.name, version: POLICY_VERSION, choices: teen.consent, note });
    }
    return teen.id;
  },

  setConsent(db, c, teenId, consent, note) {
    const { guardian, teen } = c.requireGuardianOf(teenId);
    teen.consent = normaliseConsent({ ...teen.consent, ...consent });
    teen.consentLog.push({ at: c.nowIso, by: guardian.name, version: POLICY_VERSION, choices: teen.consent, note: note || 'Changed permissions' });
    autoMatch(teen);
    return teen.id;
  },

  resetTeenPin(db, c, teenId, pin) {
    const { teen } = c.requireGuardianOf(teenId);
    check(PIN_RE.test(String(pin || '')), 'The PIN must be 4 digits.', 400);
    teen.secret = c.hash(String(pin));
    return teen.id;
  },

  deleteTeen(db, c, teenId) {
    c.requireGuardianOf(teenId);
    removeTeenRows(db, teenId);
    return null;
  },

  requestClub(db, c, clubId) {
    const teen = c.requireRole('teen');
    check(db.clubs[clubId], 'That club is not on Stride.', 404);
    check(!teen.paused, 'Your guardian has paused your account.');
    check(teen.consent.clubs, 'Your guardian has not turned on club requests.');
    check(!values(db.memberships).some((m) => m.teenId === teen.id && m.clubId === clubId), "You're already in this club.", 409);
    const pending = values(db.requests).find((r) => r.teenId === teen.id && r.clubId === clubId && r.status === 'pending');
    if (pending) return pending.id;
    const id = c.id('r');
    db.requests[id] = { id, teenId: teen.id, clubId, status: 'pending', createdAt: c.nowIso, decidedAt: null, decidedBy: null };
    return id;
  },

  cancelRequest(db, c, requestId) {
    const teen = c.requireRole('teen');
    const request = db.requests[requestId];
    check(request && request.teenId === teen.id, 'That request is not yours.');
    check(request.status === 'pending', 'Your guardian has already answered this request.', 409);
    delete db.requests[requestId];
    return null;
  },

  decideRequest(db, c, requestId, decision) {
    const request = db.requests[requestId];
    check(request, 'That request no longer exists.', 404);
    const { guardian } = c.requireGuardianOf(request.teenId);
    check(['approved', 'declined', 'pending'].includes(decision), 'Choose approve or not now.', 400);
    for (const m of values(db.memberships)) if (m.requestId === requestId) delete db.memberships[m.id];
    request.status = decision;
    request.decidedAt = decision === 'pending' ? null : c.nowIso;
    request.decidedBy = decision === 'pending' ? null : guardian.id;
    if (decision === 'approved') {
      const already = values(db.memberships).some((m) => m.teenId === request.teenId && m.clubId === request.clubId);
      if (!already) {
        const id = c.id('m');
        db.memberships[id] = { id, teenId: request.teenId, clubId: request.clubId, since: isoDate(c.now), requestId };
      }
    }
    return requestId;
  },

  setAttendance(db, c, { teenId, clubId, date, present } = {}) {
    const mentor = c.requireRole('mentor');
    const club = db.clubs[clubId];
    check(club && club.mentorId === mentor.mentorId, 'Only the club leader can mark the register.');
    check(values(db.memberships).some((m) => m.teenId === teenId && m.clubId === clubId), 'That teen is not in this club.', 400);
    check(/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')), 'Pick a session date.', 400);
    check(date <= isoDate(c.now), "You can't mark a session that hasn't happened yet.", 400);
    const id = `a_${teenId}_${clubId}_${date}`;
    if (present) db.attendance[id] = { id, teenId, clubId, date, confirmedBy: mentor.mentorId, at: c.nowIso };
    else delete db.attendance[id];
    return present ? id : null;
  },

  saveSteps(db, c, lessonId, steps) {
    const teen = c.requireRole('teen');
    const lesson = db.lessons[lessonId];
    check(lesson, 'That lesson is no longer on Stride.', 404);
    check(!teen.paused, 'Your guardian has paused your account.');
    const id = `${teen.id}_${lessonId}`;
    const task = db.tasks[id];
    check(!task || !['submitted', 'confirmed'].includes(task.status), task?.status === 'confirmed' ? 'This task is already confirmed.' : 'Take your task back before changing it.', 409);
    const clean = {};
    lesson.steps.forEach((_, i) => {
      if (steps && steps[i]) clean[i] = true;
    });
    db.tasks[id] = task
      ? { ...task, steps: clean }
      : { id, teenId: teen.id, lessonId, steps: clean, status: 'draft', submittedAt: null, reviewedAt: null, reviewedBy: null, note: null };
    return id;
  },

  submitTask(db, c, lessonId) {
    const teen = c.requireRole('teen');
    check(!teen.paused, 'Your guardian has paused your account.');
    const lesson = db.lessons[lessonId];
    const task = db.tasks[`${teen.id}_${lessonId}`];
    check(lesson && task, 'Tick off the steps first.', 400);
    check(['draft', 'returned'].includes(task.status), 'This task has already been sent.', 409);
    check(lesson.steps.every((_, i) => task.steps[i]), 'Tick off every step first.', 400);
    task.status = 'submitted';
    task.submittedAt = c.nowIso;
    return task.id;
  },

  withdrawTask(db, c, lessonId) {
    const teen = c.requireRole('teen');
    const task = db.tasks[`${teen.id}_${lessonId}`];
    check(task && task.status === 'submitted', 'There is nothing waiting to take back.', 409);
    task.status = 'draft';
    task.submittedAt = null;
    return task.id;
  },

  reviewTask(db, c, taskId, { approve, note } = {}) {
    const mentor = c.requireRole('mentor');
    const task = db.tasks[taskId];
    check(task, 'That task no longer exists.', 404);
    const lesson = db.lessons[task.lessonId];
    check(canReview(db, mentor.mentorId, lesson), 'Only the lesson mentor or club leader can confirm this task.');
    check(task.status === 'submitted', 'This task is not waiting for you.', 409);
    const cleanNote = String(note || '').trim();
    task.reviewedAt = c.nowIso;
    task.reviewedBy = mentor.mentorId;
    if (!approve) {
      check(cleanNote, 'Add a short note so they know what to change.', 400);
      task.status = 'returned';
      task.note = cleanNote;
      return task.id;
    }
    task.status = 'confirmed';
    task.note = cleanNote || null;
    const id = c.id('b');
    db.badges[id] = { id, teenId: task.teenId, name: lesson.badge, mentorId: mentor.mentorId, clubId: lesson.club || null, lessonId: lesson.id, at: c.nowIso };
    return task.id;
  },

  saveLesson(db, c, fields = {}) {
    const user = c.requireRole('mentor');
    const profile = db.mentors[user.mentorId];
    const existing = fields.id ? db.lessons[fields.id] : null;
    check(!fields.id || existing, 'That lesson no longer exists.', 404);
    check(!existing || existing.mentorId === user.mentorId, 'You can only edit your own lessons.');
    const title = String(fields.title || '').trim();
    const task = String(fields.task || '').trim();
    const badge = String(fields.badge || '').trim();
    const steps = (fields.steps || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 6);
    check(title, 'Give the lesson a title.', 400);
    check(task, 'Describe the offline task.', 400);
    check(steps.length >= 1, 'Add at least one step.', 400);
    check(badge, 'Name the badge they earn.', 400);
    const club = fields.club || null;
    check(!club || db.clubs[club]?.mentorId === user.mentorId, 'You can only link a club you lead.');
    const type = categoryIds.includes(fields.type) ? fields.type : club ? db.clubs[club].type : categoryIds[0];
    const minutes = Math.min(60, Math.max(1, Math.round(Number(fields.minutes) || 5)));
    const videoUrl = String(fields.videoUrl || '').trim();
    check(!videoUrl || /^https?:\/\/\S+$/i.test(videoUrl), 'The video link should start with https://', 400);
    const id = existing ? existing.id : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'lesson'}-${c.id('l').slice(-5)}`;
    db.lessons[id] = {
      ...(existing || { createdAt: c.nowIso, image: null, size: null }),
      id, mentorId: user.mentorId, type, club, title, minutes, task, steps, badge, videoUrl,
      by: profile.short, from: `from ${profile.first}`, confirmer: profile.first
    };
    return id;
  },

  deleteLesson(db, c, lessonId) {
    const user = c.requireRole('mentor');
    const lesson = db.lessons[lessonId];
    check(lesson, 'That lesson no longer exists.', 404);
    check(lesson.mentorId === user.mentorId, 'You can only remove your own lessons.');
    delete db.lessons[lessonId];
    for (const t of values(db.tasks)) if (t.lessonId === lessonId && t.status !== 'confirmed') delete db.tasks[t.id];
    return null;
  },

  sendMessage(db, c, { teenId, mentorId, text } = {}) {
    const user = c.requireUser();
    check(user.role !== 'guardian', "Guardians can read messages but can't send them.");
    const clean = String(text || '').trim();
    check(clean, 'Write a message first.', 400);
    check(clean.length <= 1000, 'Keep messages under 1000 characters.', 400);
    let from;
    if (user.role === 'teen') {
      check(teenId === user.id, 'You can only send messages from your own account.');
      check(db.mentors[mentorId], 'That mentor is not on Stride.', 404);
      check(!user.paused, 'Your guardian has paused your account.');
      check(user.consent.messages, 'Your guardian has turned off messages.');
      from = 'teen';
    } else {
      check(mentorId === user.mentorId, 'You can only send messages as yourself.');
      const teen = db.users[teenId];
      check(teen && teen.role === 'teen', 'That teen is not on Stride.', 404);
      check(mentorCanReach(db, user.mentorId, teen), 'You can only message your mentees and members of your clubs.');
      check(teen.consent.messages, `${teen.nickname}'s guardian has turned off messages.`);
      check(!teen.paused, `${teen.nickname}'s account is paused.`);
      from = 'mentor';
    }
    const id = c.id('msg');
    db.messages[id] = { id, teenId, mentorId, from, text: clean, at: c.nowIso, readAt: null };
    return id;
  },

  markThreadRead(db, c, teenId, mentorId) {
    const user = c.requireUser();
    let other;
    if (user.role === 'teen' && user.id === teenId) other = 'mentor';
    else if (user.role === 'mentor' && user.mentorId === mentorId) other = 'teen';
    else return 0; // a guardian reading doesn't count as read
    let count = 0;
    for (const m of values(db.messages)) {
      if (m.teenId === teenId && m.mentorId === mentorId && m.from === other && !m.readAt) {
        m.readAt = c.nowIso;
        count += 1;
      }
    }
    return count;
  },

  fileReport(db, c, { mentorId, reason, text } = {}) {
    const user = c.requireUser();
    check(String(reason || '').trim(), 'Choose what happened.', 400);
    const id = c.id('rep');
    db.reports[id] = {
      id, by: user.id, role: user.role, teenId: user.role === 'teen' ? user.id : null, mentorId: mentorId || null,
      reason: String(reason).trim(), text: String(text || '').trim(), at: c.nowIso, status: 'open'
    };
    return id;
  }
};

function randomId(prefix) {
  const rand = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

/**
 * Runs one method against `db`, changing it in place. Callers pass a copy and save it afterwards.
 * @returns {{ value: any, session: undefined | null | { userId: string } }}
 *   `session` is undefined when the signed-in user does not change.
 */
export function applyMethod(db, method, args, { userId, now = new Date(), hash, verify, id = randomId }) {
  const run = methods[method];
  check(run, `Unknown action: ${method}`, 400);
  let session;
  const user = userId ? db.users[userId] : null;
  const c = {
    now,
    nowIso: now.toISOString(),
    hash,
    verify,
    id,
    signInAs(next) {
      session = next ? { userId: next } : null;
    },
    requireUser() {
      check(user, 'Please sign in first.', 401);
      return user;
    },
    requireRole(role) {
      check(user, 'Please sign in first.', 401);
      check(user.role === role, `Only a ${role} can do that.`);
      return user;
    },
    requireGuardianOf(teenId) {
      const guardian = c.requireRole('guardian');
      const teen = db.users[teenId];
      check(teen && teen.role === 'teen' && teen.guardianId === guardian.id, 'Only their own guardian can do that.');
      return { guardian, teen };
    }
  };
  const value = run(db, c, ...(Array.isArray(args) ? args : [args]));
  return { value, session };
}
