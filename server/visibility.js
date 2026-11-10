// What each signed-in user may read. The server sends only these rows, so one family never
// receives another family's data. This is the read half of the access rules; rules.js is the write half.
import { emptyDb } from '../src/api/seed.js';
import { mentorCanReach } from '../src/api/rules.js';

const values = (c) => Object.values(c || {});
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
const publicUser = (u) => pick(u, ['id', 'role', 'name', 'mentorId']);
// Mentors see nicknames only. Full names, birthdays and consent history stay with the guardian.
const teenForMentor = (u) => ({
  ...pick(u, ['id', 'role', 'nickname', 'color', 'goal', 'mentorId', 'paused', 'interests', 'createdAt']),
  name: u.nickname,
  consent: { mentor: !!u.consent?.mentor, messages: !!u.consent?.messages }
});
const withoutSecret = ({ secret, ...rest }) => rest;

function reachableTeens(db, mentorId) {
  const ids = new Set();
  for (const u of values(db.users)) if (u.role === 'teen' && mentorCanReach(db, mentorId, u)) ids.add(u.id);
  for (const t of values(db.tasks)) {
    const lesson = db.lessons[t.lessonId];
    if (lesson && (lesson.mentorId === mentorId || db.clubs[lesson.club]?.mentorId === mentorId)) ids.add(t.teenId);
  }
  return ids;
}

export function visibleTo(db, userId) {
  const out = emptyDb();
  out.version = db.version;
  out.mentors = db.mentors;
  out.clubs = db.clubs;
  out.lessons = db.lessons;
  const user = userId ? db.users[userId] : null;
  if (!user) return out;

  // Mentor accounts are public enough to show a name.
  for (const u of values(db.users)) if (u.role === 'mentor') out.users[u.id] = publicUser(u);
  out.users[user.id] = withoutSecret(user);

  let teenIds;
  if (user.role === 'teen') {
    teenIds = new Set([user.id]);
    const guardian = db.users[user.guardianId];
    if (guardian) out.users[guardian.id] = pick(guardian, ['id', 'role', 'name', 'relation']);
  } else if (user.role === 'guardian') {
    teenIds = new Set(values(db.users).filter((u) => u.guardianId === user.id).map((u) => u.id));
    for (const id of teenIds) out.users[id] = withoutSecret(db.users[id]);
  } else {
    teenIds = reachableTeens(db, user.mentorId);
    for (const id of teenIds) out.users[id] = teenForMentor(db.users[id]);
  }

  const mine = (row) => teenIds.has(row.teenId);
  const copy = (name, keep) => {
    for (const row of values(db[name])) if (keep(row)) out[name][row.id] = row;
  };
  copy('memberships', mine);
  copy('attendance', mine);
  copy('tasks', mine);
  if (user.role === 'mentor') {
    const own = new Set(values(db.lessons).filter((l) => l.mentorId === user.mentorId).map((l) => l.id));
    copy('badges', (b) => mine(b) || b.mentorId === user.mentorId || own.has(b.lessonId));
    copy('messages', (m) => m.mentorId === user.mentorId);
  } else {
    copy('requests', mine);
    copy('badges', mine);
    copy('messages', mine);
  }
  copy('reports', (r) => r.by === user.id);
  return out;
}
