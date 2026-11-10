// Pure read helpers over the database snapshot. They work on the full local database and on the
// filtered snapshot the server sends, which only holds rows the signed-in user may see.
import { addDays, fromIso, weekKey, weekStart } from './dates.js';

const values = (collection) => Object.values(collection || {});
const newestFirst = (key) => (a, b) => String(b[key] || '').localeCompare(String(a[key] || ''));

// Users
export const currentUser = (db, session) => (db && session?.userId ? db.users[session.userId] || null : null);
export const teensOf = (db, guardianId) =>
  values(db.users).filter((u) => u.role === 'teen' && u.guardianId === guardianId).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
// The teen a guardian is looking at: the one they picked, else whoever has a request waiting.
export function selectedTeen(db, guardianId, childId) {
  const teens = teensOf(db, guardianId);
  return (
    teens.find((t) => t.id === childId) ||
    teens.find((t) => values(db.requests).some((r) => r.teenId === t.id && r.status === 'pending')) ||
    teens[0] ||
    null
  );
}
export const teenLabel = (teen) => (teen.surname ? `${teen.name} ${teen.surname[0]}.` : teen.nickname || teen.name);
export const allowed = (teen, item) => !!teen && !teen.paused && !!teen.consent?.[item];

// Clubs and lessons
export const clubList = (db) => values(db.clubs);
export const lessonList = (db) => values(db.lessons).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
export const listedMentors = (db) => values(db.mentors).filter((m) => m.listed);
export const clubIdsOf = (db, teenId) => values(db.memberships).filter((m) => m.teenId === teenId).map((m) => m.clubId);
export const isMember = (db, teenId, clubId) => values(db.memberships).some((m) => m.teenId === teenId && m.clubId === clubId);
export const membersOf = (db, clubId) =>
  values(db.memberships)
    .filter((m) => m.clubId === clubId)
    .map((m) => db.users[m.teenId])
    .filter(Boolean)
    .sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));

// Requests
export const requestsFor = (db, teenId) => values(db.requests).filter((r) => r.teenId === teenId).sort(newestFirst('createdAt'));
export const requestFor = (db, teenId, clubId) => requestsFor(db, teenId).find((r) => r.clubId === clubId) || null;
export function clubStatus(db, teenId, clubId) {
  if (isMember(db, teenId, clubId)) return 'member';
  const request = requestFor(db, teenId, clubId);
  if (!request || request.status === 'approved') return null;
  return request.status;
}

// Progress
export const attendanceFor = (db, teenId) => values(db.attendance).filter((a) => a.teenId === teenId).sort(newestFirst('date'));
export function sessionsThisWeek(db, teenId, today = new Date()) {
  const key = weekKey(today);
  return attendanceFor(db, teenId).filter((a) => weekKey(fromIso(a.date)) === key).length;
}

/** Past `weeks` weeks plus the current one, oldest first: { key, count, met, current }. */
export function weekHistory(db, teen, weeks = 8, today = new Date()) {
  const counts = {};
  for (const a of attendanceFor(db, teen.id)) {
    const key = weekKey(fromIso(a.date));
    counts[key] = (counts[key] || 0) + 1;
  }
  const start = weekStart(today);
  return Array.from({ length: weeks + 1 }, (_, i) => {
    const key = weekKey(addDays(start, -7 * (weeks - i)));
    const count = counts[key] || 0;
    return { key, count, met: count >= (teen.goal || 1), current: i === weeks };
  });
}

/** Consecutive past weeks on goal, plus this week once it is met. */
export function streak(db, teen, today = new Date()) {
  const history = weekHistory(db, teen, 52, today);
  const current = history.pop();
  let n = 0;
  for (let i = history.length - 1; i >= 0 && history[i].met; i -= 1) n += 1;
  return n + (current.met ? 1 : 0);
}

export const badgesFor = (db, teenId) => values(db.badges).filter((b) => b.teenId === teenId).sort(newestFirst('at'));

// Tasks
export const taskFor = (db, teenId, lessonId) => db.tasks[`${teenId}_${lessonId}`] || null;
export const tasksFor = (db, teenId) => values(db.tasks).filter((t) => t.teenId === teenId);
export const lessonMentor = (db, lesson) => (lesson ? db.mentors[lesson.mentorId] || null : null);

// Mentor views
export const ledClubs = (db, mentorId) => values(db.clubs).filter((c) => c.mentorId === mentorId);
export const mentorLessons = (db, mentorId) => lessonList(db).filter((l) => l.mentorId === mentorId);
export function tasksToReview(db, mentorId) {
  return values(db.tasks)
    .filter((t) => {
      if (t.status !== 'submitted') return false;
      const lesson = db.lessons[t.lessonId];
      return lesson && (lesson.mentorId === mentorId || db.clubs[lesson.club]?.mentorId === mentorId);
    })
    .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
}
export function teensOfMentor(db, mentorId) {
  const led = new Set(ledClubs(db, mentorId).map((c) => c.id));
  const ids = new Set();
  for (const u of values(db.users)) if (u.role === 'teen' && u.mentorId === mentorId) ids.add(u.id);
  for (const m of values(db.memberships)) if (led.has(m.clubId)) ids.add(m.teenId);
  for (const m of values(db.messages)) if (m.mentorId === mentorId) ids.add(m.teenId);
  return [...ids].map((id) => db.users[id]).filter(Boolean).sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
}

// Messages
export const thread = (db, teenId, mentorId) =>
  values(db.messages).filter((m) => m.teenId === teenId && m.mentorId === mentorId).sort((a, b) => a.at.localeCompare(b.at));

/**
 * Conversations, newest first. `side` is who is reading ('teen' | 'mentor' | 'guardian');
 * `unread` counts the other side's unread messages (always 0 for a guardian).
 */
export function threads(db, { teenId, mentorId, teenIds } = {}, side = 'teen') {
  const groups = new Map();
  for (const m of values(db.messages)) {
    if (teenId && m.teenId !== teenId) continue;
    if (mentorId && m.mentorId !== mentorId) continue;
    if (teenIds && !teenIds.includes(m.teenId)) continue;
    const key = `${m.teenId}|${m.mentorId}`;
    const group = groups.get(key) || { teenId: m.teenId, mentorId: m.mentorId, last: m, unread: 0, count: 0 };
    if (m.at > group.last.at) group.last = m;
    group.count += 1;
    if (side !== 'guardian' && m.from !== side && !m.readAt) group.unread += 1;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.last.at.localeCompare(a.last.at));
}

export const unreadCount = (db, filter, side) => threads(db, filter, side).reduce((n, t) => n + t.unread, 0);
