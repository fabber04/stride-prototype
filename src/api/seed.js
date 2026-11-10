// Demo database. Everything is placed relative to `today` so the demo always looks current.
import { clubCost, clubSpots, clubs, lessons, mentors } from '../data.js';
import { POLICY_VERSION, defaultConsent } from '../onboarding.js';
import { addDays, isoDate, lastSessionDate, weekStart } from './dates.js';

// Bump when the shape of the seed changes; clients holding an older copy reseed.
export const DB_VERSION = 3;

export const DEMO_PASSWORD = 'stride';
export const DEMO_PIN = '1234';

// Demo-only hash (FNV-1a). crypto.subtle is missing on plain-http phone previews, so the local
// backend uses this. The server backend replaces it with scrypt (see server/passwords.js).
export function hashSecret(secret) {
  let h = 0x811c9dc5;
  const text = `stride:${secret}`;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv1a$${h.toString(16).padStart(8, '0')}`;
}

// `kind` matches the welcome screen's buttons: teen, guardian or mentor.
export const demoLogins = [
  { kind: 'teen', label: 'Tino', role: 'Teen, 14', login: 'tino', secret: DEMO_PIN },
  { kind: 'teen', label: 'Rudo', role: 'Teen, 16', login: 'rudo', secret: DEMO_PIN },
  { kind: 'guardian', label: 'Chiedza Moyo', role: "Guardian, Tino and Rudo's mother", login: 'chiedza@example.com', secret: DEMO_PASSWORD },
  { kind: 'guardian', label: 'Tendai Ncube', role: 'Guardian of four teens', login: 'tendai@example.com', secret: DEMO_PASSWORD },
  { kind: 'mentor', label: 'Fabulous Lashid', role: 'Mentor, Junior Coders', login: 'fabulous', secret: DEMO_PASSWORD },
  { kind: 'mentor', label: 'Farai Mapfumo', role: 'Club leader, Football Academy', login: 'farai', secret: DEMO_PASSWORD }
];

export const teenColors = ['#b4533f', '#2f6f63', '#6a5a8a', '#a87632', '#2c5784', '#94506a'];

const collections = ['users', 'mentors', 'clubs', 'lessons', 'memberships', 'requests', 'attendance', 'tasks', 'badges', 'messages', 'reports'];

export function emptyDb() {
  return { version: DB_VERSION, ...Object.fromEntries(collections.map((c) => [c, {}])) };
}

export { collections };

function stamp(date, hours = 12, minutes = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes).toISOString();
}

function yearsAgo(today, years, days) {
  return isoDate(addDays(new Date(today.getFullYear() - years, today.getMonth(), today.getDate()), -days));
}

const teens = [
  { key: 'tino', name: 'Tino', surname: 'Moyo', guardian: 'chiedza', age: [14, 40], clubs: ['football', 'chess'], mentorId: 'fabulous', goal: 2, interests: ['Sport', 'Study', 'Tech'], skip: { chess: [3, 5] }, record: true },
  { key: 'rudo', name: 'Rudo', surname: 'Moyo', guardian: 'chiedza', age: [16, 100], clubs: ['netball', 'choir'], mentorId: 'charlene', goal: 2, interests: ['Sport', 'Arts', 'Career'] },
  { key: 'ropa', name: 'Ropa', surname: 'Ncube', guardian: 'tendai', age: [15, 12], clubs: ['coders'], interests: ['Tech'] },
  { key: 'kuda', name: 'Kuda', surname: 'Ncube', guardian: 'tendai', age: [13, 200], clubs: ['football', 'robotics'], interests: ['Sport', 'STEM'] },
  { key: 'tapiwa', name: 'Tapiwa', surname: 'Ncube', guardian: 'tendai', age: [15, 60], clubs: ['football', 'vocational'], interests: ['Sport', 'Career'] },
  { key: 'farai', name: 'Farai', surname: 'Chikore', guardian: 'tendai', login: 'farai.c', age: [14, 150], clubs: ['chess'], interests: ['Study'] }
];

/**
 * @param {Date} today
 * @param {(secret: string) => string} hash  how secrets are stored (FNV locally, scrypt on the server)
 */
export function createSeed(today = new Date(), hash = hashSecret) {
  const db = emptyDb();
  const created = stamp(addDays(today, -120), 9);
  const ago = (days, hours = 12, minutes = 0) => stamp(addDays(today, -days), hours, minutes);
  const password = hash(DEMO_PASSWORD);
  const pin = hash(DEMO_PIN);

  // Catalogue
  for (const m of mentors) {
    const userId = `u_${m.id}`;
    db.mentors[m.id] = { ...m, listed: !!m.listed, userId };
    db.users[userId] = { id: userId, role: 'mentor', login: m.id, secret: password, name: m.name, createdAt: created, mentorId: m.id };
  }
  for (const c of clubs) {
    db.clubs[c.id] = { ...c, cost: clubCost[c.id], spots: clubSpots[c.id] ?? null };
  }
  lessons.forEach((l, i) => {
    db.lessons[l.id] = { ...l, image: `lessons/${l.id}.webp`, videoUrl: '', createdAt: ago(60 - i * 7, 10) };
  });

  // Guardians
  const guardians = {
    chiedza: { name: 'Chiedza Moyo', contact: 'chiedza@example.com', relation: 'Mother' },
    tendai: { name: 'Tendai Ncube', contact: 'tendai@example.com', relation: 'Legal guardian' }
  };
  for (const [key, g] of Object.entries(guardians)) {
    const id = `g_${key}`;
    db.users[id] = {
      id, role: 'guardian', login: g.contact, secret: password, name: g.name, createdAt: created,
      contact: g.contact, relation: g.relation, verifiedBy: 'id', verifiedAt: created
    };
  }

  // Teens, memberships and attendance
  teens.forEach((t, i) => {
    const id = `t_${t.key}`;
    const guardianName = guardians[t.guardian].name;
    const consent = { ...defaultConsent, record: !!t.record };
    db.users[id] = {
      id, role: 'teen', login: t.login || t.key, secret: pin, name: t.name, createdAt: created,
      surname: t.surname, nickname: t.name, dob: yearsAgo(today, t.age[0], t.age[1]), guardianId: `g_${t.guardian}`,
      mentorId: t.mentorId || null, color: teenColors[i % teenColors.length], interests: t.interests, goal: t.goal || 2,
      routine: { Sun: { label: 'Family', icon: 'home' } }, paused: false, quietHours: true, consent,
      consentLog: [{ at: created, by: guardianName, version: POLICY_VERSION, choices: consent, note: 'Initial consent' }]
    };

    for (const clubId of t.clubs) {
      const club = db.clubs[clubId];
      db.memberships[`m_${t.key}_${clubId}`] = { id: `m_${t.key}_${clubId}`, teenId: id, clubId, since: isoDate(addDays(today, -100)) };
      const skipped = (t.skip && t.skip[clubId]) || [];
      const last = lastSessionDate(club.day, today);
      for (let n = 0; n < 9; n += 1) {
        const date = addDays(last, -7 * n);
        if (isoDate(date) === isoDate(today)) continue; // today's session isn't confirmed yet
        const weeksAgo = Math.round((weekStart(today) - weekStart(date)) / (7 * 86400000));
        if (skipped.includes(weeksAgo)) continue;
        const aid = `a_${id}_${clubId}_${isoDate(date)}`;
        db.attendance[aid] = { id: aid, teenId: id, clubId, date: isoDate(date), confirmedBy: club.mentorId, at: stamp(date, 18) };
      }
    }
  });

  // Badges
  const badge = (key, teen, name, mentorId, clubId, lessonId, days) => {
    db.badges[key] = { id: key, teenId: teen, name, mentorId, clubId, lessonId, at: ago(days, 17) };
  };
  badge('b_tino_team', 't_tino', 'Team Player', 'farai', 'football', null, 29);
  badge('b_tino_gambit', 't_tino', 'First Gambit', 'simba', 'chess', null, 13);
  badge('b_rudo_voice', 't_rudo', 'Steady Voice', 'nyasha', 'choir', 'voice', 10);
  badge('b_kuda_ready', 't_kuda', 'Ready to Play', 'farai', 'football', 'warmup', 20);

  // Tasks
  const allSteps = (lessonId) => Object.fromEntries(db.lessons[lessonId].steps.map((_, i) => [i, true]));
  const task = (teen, lessonId, status, days, extra = {}) => {
    const id = `${teen}_${lessonId}`;
    db.tasks[id] = {
      id, teenId: teen, lessonId, steps: allSteps(lessonId), status, submittedAt: ago(days, 15),
      reviewedAt: null, reviewedBy: null, note: null, ...extra
    };
  };
  task('t_rudo', 'voice', 'confirmed', 11, { reviewedAt: ago(10, 17), reviewedBy: 'nyasha' });
  task('t_kuda', 'warmup', 'confirmed', 21, { reviewedAt: ago(20, 17), reviewedBy: 'farai' });
  task('t_ropa', 'python', 'submitted', 1);
  task('t_kuda', 'linebot', 'submitted', 2);
  task('t_tapiwa', 'warmup', 'submitted', 0, { submittedAt: ago(0, 8, 30) });

  // A request waiting for Chiedza
  db.requests.r_tino_coders = {
    id: 'r_tino_coders', teenId: 't_tino', clubId: 'coders', status: 'pending', createdAt: ago(1, 19), decidedAt: null, decidedBy: null
  };

  // Messages
  const msg = (key, teenId, mentorId, from, text, at, read = true) => {
    db.messages[key] = { id: key, teenId, mentorId, from, text, at, readAt: read ? at : null };
  };
  msg('msg_1', 't_tino', 'fabulous', 'mentor', "Hi Tino, I'm Fabulous, your mentor on Stride. Ask me anything about clubs, lessons or what to try next.", ago(4, 16));
  msg('msg_2', 't_tino', 'fabulous', 'teen', 'Thanks! Can I bring my own laptop to Junior Coders?', ago(4, 18, 5));
  msg('msg_3', 't_tino', 'fabulous', 'mentor', 'Yes, bring it. We have spare laptops too if yours is slow.', ago(3, 9, 12));
  msg('msg_4', 't_tino', 'fabulous', 'mentor', 'I set you a Python challenge in Learn. Have a go this week and send it to me when you finish.', ago(0, 8, 40), false);
  msg('msg_5', 't_ropa', 'fabulous', 'teen', 'I finished the quiz! Can you check it before Wednesday?', ago(1, 20, 15), false);
  msg('msg_6', 't_rudo', 'charlene', 'mentor', "Hi Rudo, I'm Charlene. Your guardian matched us. Have you ever thought about starting a small business?", ago(2, 17));

  return db;
}
