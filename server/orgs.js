import { createHash } from 'node:crypto';
import { lessons, mentors } from '../src/data.js';
import { ageBand, ageFrom } from '../src/onboarding.js';
import { confirmedToday, listingProblem, writeConfirmation } from './db.js';

const mentorById = Object.fromEntries(mentors.map((person) => [person.id, person]));
const lessonById = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson]));
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}

function hashCode(code) {
  return createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

function token() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('hex');
}

function firstName(name) {
  return String(name || 'Teen').trim().split(/\s+/)[0] || 'Teen';
}

function bandLabel(dob) {
  const age = ageFrom(dob);
  const band = ageBand(age);
  if (band === 'teen') return 'Teen';
  if (band === 'young') return 'Under 12';
  if (band === 'adult') return '18 or over';
  return 'Age not on file';
}

function orgRow(db, orgId) {
  return db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
}

export function readOrg(db, session) {
  if (session.role === 'mentor') return readMentor(db, session);
  return readClub(db, session);
}

function readClub(db, session) {
  const org = orgRow(db, session.org_id);
  const counts = db.prepare('SELECT family_id, COUNT(*) AS n FROM attendance WHERE club_id = ? GROUP BY family_id').all(session.org_id);
  const confirmed = Object.fromEntries(counts.map((row) => [row.family_id, row.n]));
  const accrued = db.prepare("SELECT COALESCE(SUM(amount_cents), 0) AS total FROM ledger_entries WHERE org_id = ? AND status = 'accrued'").get(session.org_id);
  const rows = db
    .prepare(
      `SELECT club_requests.family_id, club_requests.coach_status, teens.name, teens.dob, families.timezone
       FROM club_requests
       JOIN teens ON teens.family_id = club_requests.family_id
       JOIN families ON families.id = club_requests.family_id
       WHERE club_requests.club_id = ? AND club_requests.requested = 1 AND club_requests.decision = 'approved'`
    )
    .all(session.org_id);
  const staff = db.prepare('SELECT mentor_id FROM org_mentors WHERE org_id = ?').all(session.org_id);
  return {
    clubId: org.id,
    name: org.name,
    role: session.role,
    listingStatus: org.listing_status,
    sessionFeeCents: org.session_fee_cents,
    currency: org.currency,
    accruedCents: accrued.total,
    revision: org.revision,
    mentors: staff.map((row) => ({ id: row.mentor_id, name: mentorById[row.mentor_id]?.name || row.mentor_id })),
    roster: rows.map((row) => ({
      familyId: row.family_id,
      name: firstName(row.name),
      ageBand: bandLabel(row.dob),
      status: row.coach_status === 'accepted' ? 'accepted' : 'waiting',
      confirmed: confirmed[row.family_id] || 0,
      confirmedToday: confirmedToday(db, row.family_id, org.id, row.timezone)
    }))
  };
}

function readMentor(db, session) {
  const org = orgRow(db, session.org_id);
  const person = mentorById[session.mentor_id];
  const teens = db
    .prepare(
      `SELECT teens.family_id, teens.name, teens.dob
       FROM club_requests
       JOIN teens ON teens.family_id = club_requests.family_id
       WHERE club_requests.club_id = ? AND club_requests.decision = 'approved' AND club_requests.coach_status = 'accepted'`
    )
    .all(session.org_id);
  const accepted = new Set(teens.map((row) => row.family_id));
  const messages = db
    .prepare(
      `SELECT id, at, from_name, body, family_id FROM messages
       WHERE to_id = ? AND status = 'sent' ORDER BY at`
    )
    .all(session.mentor_id)
    .filter((row) => accepted.has(row.family_id));
  const tasks = db
    .prepare(
      `SELECT lesson_id, family_id FROM lesson_tasks
       WHERE done = 1 AND confirmed_at IS NULL`
    )
    .all()
    .filter((row) => accepted.has(row.family_id) && lessonById[row.lesson_id]?.club === session.org_id);
  const teenName = Object.fromEntries(teens.map((row) => [row.family_id, firstName(row.name)]));
  return {
    clubId: org.id,
    name: org.name,
    role: 'mentor',
    mentorId: session.mentor_id,
    mentorName: person?.name || 'Mentor',
    revision: org.revision,
    teens: teens.map((row) => ({ familyId: row.family_id, name: firstName(row.name), ageBand: bandLabel(row.dob) })),
    messages: messages.map((row) => ({ id: row.id, at: row.at, from: row.from_name, text: row.body })),
    tasks: tasks.map((row) => ({
      familyId: row.family_id,
      lessonId: row.lesson_id,
      title: lessonById[row.lesson_id]?.title || row.lesson_id,
      teenName: teenName[row.family_id]
    }))
  };
}

function reply(db, session, extra = {}) {
  const org = readOrg(db, session);
  return { scope: 'org', role: session.role, clubId: session.org_id, mentorId: session.mentor_id || null, revision: org.revision, org, ...extra };
}

export function claimOrg(db, clubId) {
  const org = orgRow(db, clubId);
  if (!org) return { error: 'unknown_club' };
  if (org.owner_claimed) return { error: 'claimed' };
  const sessionToken = token();
  db.exec('BEGIN');
  try {
    const result = db.prepare('UPDATE organizations SET owner_claimed = 1, revision = revision + 1 WHERE id = ? AND owner_claimed = 0').run(clubId);
    if (!result.changes) {
      db.exec('ROLLBACK');
      return { error: 'claimed' };
    }
    db.prepare('INSERT INTO org_sessions (token, org_id, role, mentor_id, created_at) VALUES (?, ?, ?, NULL, ?)').run(
      sessionToken,
      clubId,
      'owner',
      new Date().toISOString()
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return reply(db, { role: 'owner', org_id: clubId, mentor_id: null }, { token: sessionToken });
}

export function acceptMember(db, session, familyId) {
  if (session.scope !== 'org' || (session.role !== 'owner' && session.role !== 'leader')) return { error: 'forbidden' };
  const closed = listingProblem(db, session.org_id);
  if (closed) return { error: closed };
  const row = db.prepare('SELECT decision FROM club_requests WHERE family_id = ? AND club_id = ?').get(familyId, session.org_id);
  if (row?.decision !== 'approved') return { error: 'not_approved' };
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE club_requests SET coach_status = ? WHERE family_id = ? AND club_id = ?').run('accepted', familyId, session.org_id);
    db.prepare('UPDATE families SET revision = revision + 1 WHERE id = ?').run(familyId);
    db.prepare('UPDATE organizations SET revision = revision + 1 WHERE id = ?').run(session.org_id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return reply(db, session);
}

export function confirmMember(db, session, familyId) {
  if (session.scope !== 'org' || (session.role !== 'owner' && session.role !== 'leader')) return { error: 'forbidden' };
  const closed = listingProblem(db, session.org_id);
  if (closed) return { error: closed };
  const row = db.prepare('SELECT decision, coach_status FROM club_requests WHERE family_id = ? AND club_id = ?').get(familyId, session.org_id);
  if (row?.decision !== 'approved' || row?.coach_status !== 'accepted') return { error: 'not_accepted' };
  const family = db.prepare('SELECT timezone FROM families WHERE id = ?').get(familyId);
  if (confirmedToday(db, familyId, session.org_id, family?.timezone)) return { error: 'already_confirmed' };
  const by = session.role === 'owner' ? 'Club owner' : 'Club leader';
  db.exec('BEGIN');
  try {
    const written = writeConfirmation(db, { familyId, clubId: session.org_id, by });
    if (written.error) throw new Error(written.error);
    db.prepare('UPDATE families SET revision = revision + 1 WHERE id = ?').run(familyId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return reply(db, session);
}

export function mintStaff(db, session, role, mentorId) {
  if (session.scope !== 'org' || session.role !== 'owner') return { error: 'forbidden' };
  if (role !== 'leader' && role !== 'mentor') return { error: 'role' };
  if (role === 'mentor') {
    if (!mentorById[mentorId]) return { error: 'unknown_mentor' };
    db.prepare('INSERT INTO org_mentors (org_id, mentor_id) VALUES (?, ?) ON CONFLICT(org_id, mentor_id) DO NOTHING').run(session.org_id, mentorId);
  }
  const code = makeCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM org_invites WHERE org_id = ? AND role = ? AND ifnull(mentor_id, '') = ifnull(?, '')").run(
    session.org_id,
    role,
    role === 'mentor' ? mentorId : null
  );
  db.prepare('INSERT INTO org_invites (org_id, role, mentor_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    session.org_id,
    role,
    role === 'mentor' ? mentorId : null,
    hashCode(code),
    expiresAt,
    now.toISOString()
  );
  return reply(db, session, { invite: { role, code, expiresAt, mentorId: role === 'mentor' ? mentorId : null, clubId: session.org_id } });
}

export function confirmMentorTask(db, session, familyId, lessonId) {
  if (session.scope !== 'org' || session.role !== 'mentor') return { error: 'forbidden' };
  const lesson = lessonById[lessonId];
  if (!lesson || lesson.club !== session.org_id) return { error: 'lesson' };
  const member = db.prepare('SELECT coach_status FROM club_requests WHERE family_id = ? AND club_id = ?').get(familyId, session.org_id);
  if (member?.coach_status !== 'accepted') return { error: 'not_accepted' };
  const task = db.prepare('SELECT done, confirmed_at FROM lesson_tasks WHERE family_id = ? AND lesson_id = ?').get(familyId, lessonId);
  if (!task?.done) return { error: 'lesson' };
  if (task.confirmed_at) return { error: 'already_confirmed' };
  const person = mentorById[session.mentor_id];
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE lesson_tasks SET confirmed_at = ?, confirmed_by = ? WHERE family_id = ? AND lesson_id = ?').run(
      new Date().toISOString(),
      person?.short || person?.name || 'Mentor',
      familyId,
      lessonId
    );
    db.prepare('UPDATE families SET revision = revision + 1 WHERE id = ?').run(familyId);
    db.prepare('UPDATE organizations SET revision = revision + 1 WHERE id = ?').run(session.org_id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return reply(db, session);
}
