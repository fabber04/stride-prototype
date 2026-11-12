import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { clubs, lessons } from '../src/data.js';
import { clubOf, DEFAULT_ZONE, messageRefusal, requestRefusal, screen, setupRefusal } from './rules.js';

const SAVED_DEFAULTS = {
  onboarded: false,
  account: null,
  consent: null,
  consentLog: [],
  pendingInvite: null,
  paused: false,
  quietHours: true,
  requested: {},
  decisions: {},
  skipped: {},
  messages: [],
  reports: [],
  taskDone: {},
  recordShared: false,
  summarySent: false,
  parentGroups: {}
};

export function openDatabase(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      revision INTEGER NOT NULL DEFAULT 0,
      pending_invite TEXT,
      timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'teen',
      club_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      club_id TEXT,
      code_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS join_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      at TEXT NOT NULL,
      ok INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      club_id TEXT NOT NULL,
      at TEXT NOT NULL,
      confirmed_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guardians (
      family_id TEXT PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      contact TEXT,
      relation TEXT,
      verified_by TEXT,
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS teens (
      family_id TEXT PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      nickname TEXT,
      dob TEXT,
      goal INTEGER,
      interests TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      family_id TEXT PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
      onboarded INTEGER NOT NULL DEFAULT 0,
      paused INTEGER NOT NULL DEFAULT 0,
      quiet_hours INTEGER NOT NULL DEFAULT 1,
      record_shared INTEGER NOT NULL DEFAULT 0,
      summary_sent INTEGER NOT NULL DEFAULT 0,
      consent TEXT,
      parent_groups TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS consent_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      at TEXT NOT NULL,
      by_name TEXT,
      version TEXT,
      choices TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS club_requests (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      club_id TEXT NOT NULL,
      requested INTEGER NOT NULL DEFAULT 0,
      decision TEXT,
      coach_status TEXT,
      skipped INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (family_id, club_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      at TEXT NOT NULL,
      from_name TEXT NOT NULL,
      to_id TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      flag TEXT,
      released_by TEXT,
      released_at TEXT,
      PRIMARY KEY (family_id, id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      at TEXT NOT NULL,
      by_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (family_id, id)
    );

    CREATE TABLE IF NOT EXISTS lesson_tasks (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL,
      done INTEGER NOT NULL,
      confirmed_at TEXT,
      confirmed_by TEXT,
      PRIMARY KEY (family_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      listing_status TEXT NOT NULL DEFAULT 'listed',
      session_fee_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      owner_claimed INTEGER NOT NULL DEFAULT 0,
      revision INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS org_sessions (
      token TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      role TEXT NOT NULL,
      mentor_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      role TEXT NOT NULL,
      mentor_id TEXT,
      code_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_mentors (
      org_id TEXT NOT NULL REFERENCES organizations(id),
      mentor_id TEXT NOT NULL,
      PRIMARY KEY (org_id, mentor_id)
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      family_id TEXT NOT NULL,
      attendance_id TEXT NOT NULL UNIQUE,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      at TEXT NOT NULL
    );
  `);
  ensureColumn(db, 'families', 'timezone', "TEXT NOT NULL DEFAULT 'Africa/Johannesburg'");
  ensureColumn(db, 'sessions', 'role', "TEXT NOT NULL DEFAULT 'teen'");
  ensureColumn(db, 'sessions', 'club_id', 'TEXT');
  ensureColumn(db, 'club_requests', 'coach_status', 'TEXT');
  ensureColumn(db, 'messages', 'released_by', 'TEXT');
  ensureColumn(db, 'messages', 'released_at', 'TEXT');
  ensureColumn(db, 'lesson_tasks', 'confirmed_at', 'TEXT');
  ensureColumn(db, 'lesson_tasks', 'confirmed_by', 'TEXT');
  seedOrganizations(db);
  return db;
}

function seedOrganizations(db) {
  const insert = db.prepare(
    `INSERT INTO organizations (id, name, listing_status, session_fee_cents, currency, owner_claimed, revision)
     VALUES (?, ?, 'listed', 500, 'USD', 0, 0)
     ON CONFLICT(id) DO NOTHING`
  );
  for (const club of clubs) insert.run(club.id, club.name);
  db.prepare('INSERT INTO org_mentors (org_id, mentor_id) VALUES (?, ?) ON CONFLICT(org_id, mentor_id) DO NOTHING').run('coders', 'fabulous');
}

function ensureColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((col) => col.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function flag(value) {
  return value ? 1 : 0;
}

export function readState(db, familyId) {
  const family = db.prepare('SELECT pending_invite, timezone FROM families WHERE id = ?').get(familyId);
  const settings = db.prepare('SELECT * FROM settings WHERE family_id = ?').get(familyId);
  const guardian = db.prepare('SELECT * FROM guardians WHERE family_id = ?').get(familyId);
  const teen = db.prepare('SELECT * FROM teens WHERE family_id = ?').get(familyId);
  const consentRows = db.prepare('SELECT at, by_name, version, choices, note FROM consent_log WHERE family_id = ? ORDER BY id').all(familyId);
  const clubs = db.prepare('SELECT club_id, requested, decision, coach_status, skipped FROM club_requests WHERE family_id = ?').all(familyId);
  const messages = db.prepare(
    'SELECT id, at, from_name, to_id, body, status, flag, released_by, released_at FROM messages WHERE family_id = ? ORDER BY at'
  ).all(familyId);
  const reports = db.prepare('SELECT id, at, by_name, reason, status FROM reports WHERE family_id = ? ORDER BY at').all(familyId);
  const tasks = db.prepare('SELECT lesson_id, done, confirmed_at, confirmed_by FROM lesson_tasks WHERE family_id = ?').all(familyId);
  const attendance = db.prepare('SELECT id, club_id, at, confirmed_by FROM attendance WHERE family_id = ? ORDER BY at').all(familyId);

  const requested = {};
  const decisions = {};
  const coach = {};
  const skipped = {};
  for (const row of clubs) {
    if (row.requested) requested[row.club_id] = true;
    if (row.decision) decisions[row.club_id] = row.decision;
    if (row.coach_status) coach[row.club_id] = row.coach_status;
    if (row.skipped) skipped[row.club_id] = true;
  }

  const taskDone = {};
  const taskConfirmed = {};
  for (const row of tasks) {
    taskDone[row.lesson_id] = !!row.done;
    if (row.confirmed_at) taskConfirmed[row.lesson_id] = { at: row.confirmed_at, by: row.confirmed_by || '' };
  }

  let account = null;
  if (guardian || teen) {
    account = {
      guardian: guardian
        ? {
            name: guardian.name,
            contact: guardian.contact || '',
            relation: guardian.relation || '',
            verifiedBy: guardian.verified_by || '',
            verifiedAt: guardian.verified_at || null
          }
        : null,
      teen: teen
        ? {
            name: teen.name,
            nickname: teen.nickname || teen.name,
            dob: teen.dob || '',
            goal: teen.goal || 3,
            interests: JSON.parse(teen.interests || '[]')
          }
        : null
    };
  }

  return {
    ...SAVED_DEFAULTS,
    onboarded: !!settings?.onboarded,
    paused: !!settings?.paused,
    quietHours: settings ? !!settings.quiet_hours : true,
    recordShared: !!settings?.record_shared,
    summarySent: !!settings?.summary_sent,
    consent: settings?.consent ? JSON.parse(settings.consent) : null,
    parentGroups: JSON.parse(settings?.parent_groups || '{}'),
    pendingInvite: family?.pending_invite ? JSON.parse(family.pending_invite) : null,
    timezone: family?.timezone || 'Africa/Johannesburg',
    account,
    consentLog: consentRows.map((row) => ({
      at: row.at,
      by: row.by_name,
      version: row.version,
      choices: JSON.parse(row.choices || '{}'),
      note: row.note
    })),
    requested,
    decisions,
    coach,
    skipped,
    attendance: attendance.map((row) => ({
      id: row.id,
      clubId: row.club_id,
      at: row.at,
      by: row.confirmed_by
    })),
    messages: messages.map((row) => ({
      id: row.id,
      at: row.at,
      from: row.from_name,
      to: row.to_id,
      text: row.body,
      status: row.status,
      flag: row.flag || null,
      releasedBy: row.released_by || null,
      releasedAt: row.released_at || null
    })),
    reports: reports.map((row) => ({
      id: row.id,
      at: row.at,
      by: row.by_name,
      reason: row.reason,
      status: row.status
    })),
    taskDone,
    taskConfirmed
  };
}

function applyPatch(db, familyId, patch) {
  if ('pendingInvite' in patch) {
    db.prepare('UPDATE families SET pending_invite = ? WHERE id = ?').run(
      patch.pendingInvite ? JSON.stringify(patch.pendingInvite) : null,
      familyId
    );
  }

  const settings = {};
  if ('onboarded' in patch) settings.onboarded = flag(patch.onboarded);
  if ('paused' in patch) settings.paused = flag(patch.paused);
  if ('quietHours' in patch) settings.quiet_hours = flag(patch.quietHours);
  if ('recordShared' in patch) settings.record_shared = flag(patch.recordShared);
  if ('summarySent' in patch) settings.summary_sent = flag(patch.summarySent);
  if ('consent' in patch) settings.consent = patch.consent ? JSON.stringify(patch.consent) : null;
  if ('parentGroups' in patch) settings.parent_groups = JSON.stringify(patch.parentGroups || {});
  const settingKeys = Object.keys(settings);
  if (settingKeys.length) {
    const assignments = settingKeys.map((key) => `${key} = ?`).join(', ');
    db.prepare(`UPDATE settings SET ${assignments} WHERE family_id = ?`).run(...settingKeys.map((key) => settings[key]), familyId);
  }

  if ('account' in patch) {
    db.prepare('DELETE FROM guardians WHERE family_id = ?').run(familyId);
    db.prepare('DELETE FROM teens WHERE family_id = ?').run(familyId);
    const account = patch.account;
    if (account?.guardian?.name) {
      const guardian = account.guardian;
      db.prepare(
        `INSERT INTO guardians (family_id, name, contact, relation, verified_by, verified_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(familyId, guardian.name, guardian.contact || '', guardian.relation || '', guardian.verifiedBy || '', guardian.verifiedAt || null);
    }
    if (account?.teen?.name) {
      const teen = account.teen;
      db.prepare(
        `INSERT INTO teens (family_id, name, nickname, dob, goal, interests)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        familyId,
        teen.name,
        teen.nickname || teen.name,
        teen.dob || '',
        teen.goal || 3,
        JSON.stringify(teen.interests || [])
      );
    }
  }

  if ('taskDone' in patch) {
    const insert = db.prepare(
      `INSERT INTO lesson_tasks (family_id, lesson_id, done) VALUES (?, ?, ?)
       ON CONFLICT(family_id, lesson_id) DO UPDATE SET done = excluded.done`
    );
    for (const [lessonId, done] of Object.entries(patch.taskDone || {})) {
      insert.run(familyId, lessonId, done ? 1 : 0);
    }
  }
}

function appendConsent(db, familyId, entries) {
  const insert = db.prepare(
    `INSERT INTO consent_log (family_id, at, by_name, version, choices, note)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const exists = db.prepare('SELECT 1 FROM consent_log WHERE family_id = ? AND at = ? AND note = ?');
  for (const entry of entries || []) {
    if (exists.get(familyId, entry.at, entry.note || '')) continue;
    insert.run(familyId, entry.at, entry.by || '', entry.version || '', JSON.stringify(entry.choices || {}), entry.note || '');
  }
}

function bump(db, familyId) {
  db.prepare('UPDATE families SET revision = revision + 1 WHERE id = ?').run(familyId);
  return db.prepare('SELECT revision FROM families WHERE id = ?').get(familyId).revision;
}

export function writePatch(db, familyId, patch) {
  db.exec('BEGIN');
  try {
    applyPatch(db, familyId, patch);
    const revision = bump(db, familyId);
    db.exec('COMMIT');
    return { revision, state: readState(db, familyId) };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

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

function safePatch(patch) {
  const next = { ...(patch || {}) };
  delete next.consentLog;
  delete next.messages;
  delete next.reports;
  delete next.requested;
  delete next.decisions;
  delete next.skipped;
  delete next.coach;
  delete next.attendance;
  if (next.account?.guardian) next.account = { ...next.account, guardian: { ...next.account.guardian, verifiedAt: null } };
  if (next.consent?.mentor === false) next.consent = { ...next.consent, messages: false };
  return next;
}

function insertInvite(db, familyId, role, clubId) {
  const code = makeCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM invites WHERE family_id = ? AND role = ? AND ifnull(club_id, '') = ifnull(?, '')").run(familyId, role, clubId || null);
  db.prepare(
    'INSERT INTO invites (family_id, role, club_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(familyId, role, clubId || null, hashCode(code), expiresAt, now.toISOString());
  return { role, code, expiresAt, clubId: clubId || null };
}

function transact(db, familyId, work) {
  db.exec('BEGIN');
  try {
    const extra = work();
    const revision = bump(db, familyId);
    db.exec('COMMIT');
    return { ...extra, revision, state: readState(db, familyId) };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function createFamily(db, { role, state, timezone }) {
  if (role !== 'teen' && role !== 'guardian') return { error: 'role' };
  const patch = state || {};
  if (role === 'guardian') {
    const problem = setupRefusal(patch);
    if (problem) return { error: problem };
  }
  const id = randomUUID();
  const sessionToken = token();
  let code = makeCode();
  while (db.prepare('SELECT 1 FROM families WHERE code = ?').get(code)) code = makeCode();
  const zone = timezone || DEFAULT_ZONE;
  const now = new Date().toISOString();
  const kept = role === 'teen' ? { pendingInvite: patch.pendingInvite || null, quietHours: patch.quietHours !== false } : safePatch(patch);

  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO families (id, code, revision, timezone, created_at) VALUES (?, ?, 0, ?, ?)').run(id, code, zone, now);
    db.prepare('INSERT INTO settings (family_id) VALUES (?)').run(id);
    db.prepare('INSERT INTO sessions (token, family_id, role, created_at) VALUES (?, ?, ?, ?)').run(sessionToken, id, role, now);
    applyPatch(db, id, kept);
    if (role === 'guardian') appendConsent(db, id, patch.consentLog);
    const invite = insertInvite(db, id, role === 'teen' ? 'guardian' : 'teen', null);
    const revision = bump(db, id);
    db.exec('COMMIT');
    return { token: sessionToken, role, clubId: null, invite, revision, state: readState(db, id) };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function joinFamily(db, code, ip) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const failures = db.prepare('SELECT COUNT(*) AS n FROM join_attempts WHERE ip = ? AND at > ? AND ok = 0').get(ip || 'local', since);
  if (failures.n >= 8) return { error: 'rate_limited' };
  const now = new Date().toISOString();
  const invite = db.prepare('SELECT * FROM invites WHERE code_hash = ?').get(hashCode(code));
  const orgInvite = db.prepare('SELECT * FROM org_invites WHERE code_hash = ?').get(hashCode(code));
  const familyFresh = invite && invite.expires_at > now;
  const orgFresh = orgInvite && orgInvite.expires_at > now;
  db.prepare('INSERT INTO join_attempts (ip, at, ok) VALUES (?, ?, ?)').run(ip || 'local', new Date().toISOString(), familyFresh || orgFresh ? 1 : 0);
  if (familyFresh) return acceptFamilyInvite(db, invite);
  if (orgFresh) return acceptOrgInvite(db, orgInvite);
  return { error: invite || orgInvite ? 'expired' : 'unknown' };
}

function acceptFamilyInvite(db, invite) {
  const sessionToken = token();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO sessions (token, family_id, role, club_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      sessionToken,
      invite.family_id,
      invite.role,
      invite.club_id,
      new Date().toISOString()
    );
    db.prepare('DELETE FROM invites WHERE id = ?').run(invite.id);
    db.exec('COMMIT');
    const family = db.prepare('SELECT revision FROM families WHERE id = ?').get(invite.family_id);
    return {
      token: sessionToken,
      role: invite.role,
      scope: 'family',
      clubId: invite.club_id,
      revision: family.revision,
      state: readState(db, invite.family_id)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function acceptOrgInvite(db, invite) {
  const sessionToken = token();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO org_sessions (token, org_id, role, mentor_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      sessionToken,
      invite.org_id,
      invite.role,
      invite.mentor_id,
      new Date().toISOString()
    );
    db.prepare('DELETE FROM org_invites WHERE id = ?').run(invite.id);
    db.exec('COMMIT');
    const org = db.prepare('SELECT revision FROM organizations WHERE id = ?').get(invite.org_id);
    return {
      token: sessionToken,
      role: invite.role,
      scope: 'org',
      clubId: invite.org_id,
      mentorId: invite.mentor_id,
      revision: org?.revision || 0
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function familyForToken(db, tokenValue) {
  if (!tokenValue) return null;
  const family = db
    .prepare(
      'SELECT sessions.family_id, sessions.role, sessions.club_id, families.revision FROM sessions JOIN families ON families.id = sessions.family_id WHERE token = ?'
    )
    .get(tokenValue);
  if (family) return { ...family, scope: 'family' };
  const org = db
    .prepare('SELECT token, org_id, role, mentor_id FROM org_sessions WHERE token = ?')
    .get(tokenValue);
  if (!org) return null;
  const revision = db.prepare('SELECT revision FROM organizations WHERE id = ?').get(org.org_id);
  return {
    scope: 'org',
    role: org.role,
    org_id: org.org_id,
    club_id: org.org_id,
    mentor_id: org.mentor_id,
    family_id: null,
    revision: revision?.revision || 0
  };
}

export function listingProblem(db, clubId) {
  const org = db.prepare('SELECT listing_status FROM organizations WHERE id = ?').get(clubId);
  if (!org) return 'unknown_club';
  if (org.listing_status !== 'listed') return 'suspended';
  return null;
}

export function writeConfirmation(db, { familyId, clubId, by }) {
  const org = db.prepare('SELECT session_fee_cents, currency, listing_status FROM organizations WHERE id = ?').get(clubId);
  if (!org || org.listing_status !== 'listed') return { error: org ? 'suspended' : 'unknown_club' };
  const attendanceId = randomUUID();
  const at = new Date().toISOString();
  db.prepare('INSERT INTO attendance (id, family_id, club_id, at, confirmed_by) VALUES (?, ?, ?, ?, ?)').run(
    attendanceId,
    familyId,
    clubId,
    at,
    by
  );
  db.prepare(
    `INSERT INTO ledger_entries (id, org_id, family_id, attendance_id, amount_cents, currency, status, at)
     VALUES (?, ?, ?, ?, ?, ?, 'accrued', ?)`
  ).run(randomUUID(), clubId, familyId, attendanceId, org.session_fee_cents, org.currency, at);
  db.prepare('UPDATE organizations SET revision = revision + 1 WHERE id = ?').run(clubId);
  return { ok: true };
}

export function deleteFamily(db, session) {
  if (session.role !== 'guardian') return { error: 'forbidden' };
  db.prepare('DELETE FROM families WHERE id = ?').run(session.family_id);
  return { ok: true };
}

export function completeSetup(db, session, patch) {
  if (session.role !== 'guardian') return { error: 'forbidden' };
  const problem = setupRefusal(patch || {});
  if (problem) return { error: problem };
  return transact(db, session.family_id, () => {
    applyPatch(db, session.family_id, { ...safePatch(patch), onboarded: true, pendingInvite: null });
    appendConsent(db, session.family_id, patch.consentLog);
    const teenSession = db.prepare("SELECT 1 FROM sessions WHERE family_id = ? AND role = 'teen'").get(session.family_id);
    const invite = teenSession ? null : insertInvite(db, session.family_id, 'teen', null);
    return { invite };
  });
}

export function updateProfile(db, session, profile) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const teen = db.prepare('SELECT name, dob FROM teens WHERE family_id = ?').get(session.family_id);
  if (!teen) return { error: 'account' };
  return transact(db, session.family_id, () => {
    db.prepare('UPDATE teens SET nickname = ?, goal = ?, interests = ? WHERE family_id = ?').run(
      profile.nickname || teen.name,
      profile.goal || 3,
      JSON.stringify(profile.interests || []),
      session.family_id
    );
    return {};
  });
}

export function requestClub(db, session, clubId) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const state = readState(db, session.family_id);
  const club = clubOf(clubId);
  const problem = requestRefusal(state, club);
  if (problem) return { error: problem };
  return transact(db, session.family_id, () => {
    db.prepare(
      `INSERT INTO club_requests (family_id, club_id, requested, decision, coach_status, skipped)
       VALUES (?, ?, 1, NULL, NULL, 0)
       ON CONFLICT(family_id, club_id) DO UPDATE SET
         requested = 1,
         decision = CASE WHEN club_requests.decision = 'approved' THEN 'approved' ELSE NULL END,
         coach_status = CASE WHEN club_requests.decision = 'approved' THEN club_requests.coach_status ELSE NULL END`
    ).run(session.family_id, clubId);
    return {};
  });
}

export function withdrawRequest(db, session, clubId) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const row = db.prepare('SELECT decision FROM club_requests WHERE family_id = ? AND club_id = ?').get(session.family_id, clubId);
  if (row?.decision) return { error: 'decided' };
  return transact(db, session.family_id, () => {
    db.prepare('UPDATE club_requests SET requested = 0 WHERE family_id = ? AND club_id = ?').run(session.family_id, clubId);
    return {};
  });
}

function bumpOrg(db, orgId) {
  db.prepare('UPDATE organizations SET revision = revision + 1 WHERE id = ?').run(orgId);
}

function bumpMentorOrgs(db, mentorId) {
  for (const row of db.prepare('SELECT org_id FROM org_mentors WHERE mentor_id = ?').all(mentorId)) bumpOrg(db, row.org_id);
}

export function decideClub(db, session, clubId, decision) {
  if (session.role !== 'guardian') return { error: 'forbidden' };
  if (decision !== 'approved' && decision !== 'declined') return { error: 'decision' };
  const row = db.prepare('SELECT requested FROM club_requests WHERE family_id = ? AND club_id = ?').get(session.family_id, clubId);
  if (!row?.requested) return { error: 'unknown_club' };
  return transact(db, session.family_id, () => {
    db.prepare('UPDATE club_requests SET decision = ?, coach_status = NULL WHERE family_id = ? AND club_id = ?').run(
      decision,
      session.family_id,
      clubId
    );
    bumpOrg(db, clubId);
    return {};
  });
}

export function sendMessage(db, session, { to, text }) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const state = readState(db, session.family_id);
  const problem = messageRefusal(state);
  if (problem) return { error: problem };
  const body = String(text || '').trim();
  if (!to || !body) return { error: 'message' };
  const flag = screen(body);
  const status = flag ? 'held' : 'sent';
  return transact(db, session.family_id, () => {
    db.prepare(
      `INSERT INTO messages (family_id, id, at, from_name, to_id, body, status, flag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      session.family_id,
      randomUUID(),
      new Date().toISOString(),
      state.account?.teen?.nickname || 'Teen',
      to,
      body,
      status,
      flag
    );
    if (status === 'sent') bumpMentorOrgs(db, to);
    return {};
  });
}

export function releaseMessage(db, session, id, status) {
  if (session.role !== 'guardian') return { error: 'forbidden' };
  if (status !== 'sent' && status !== 'blocked') return { error: 'status' };
  const row = db.prepare('SELECT status, to_id FROM messages WHERE family_id = ? AND id = ?').get(session.family_id, id);
  if (!row) return { error: 'unknown' };
  if (row.status !== 'held') return { error: 'released' };
  const guardian = db.prepare('SELECT name FROM guardians WHERE family_id = ?').get(session.family_id);
  return transact(db, session.family_id, () => {
    db.prepare('UPDATE messages SET status = ?, released_by = ?, released_at = ? WHERE family_id = ? AND id = ?').run(
      status,
      guardian?.name || 'Guardian',
      new Date().toISOString(),
      session.family_id,
      id
    );
    if (status === 'sent') bumpMentorOrgs(db, row.to_id);
    return {};
  });
}

export function sendReport(db, session, reason) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const text = String(reason || '').trim();
  if (!text) return { error: 'reason' };
  const state = readState(db, session.family_id);
  return transact(db, session.family_id, () => {
    db.prepare('INSERT INTO reports (family_id, id, at, by_name, reason, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      session.family_id,
      randomUUID(),
      new Date().toISOString(),
      state.account?.teen?.nickname || 'Teen',
      text,
      'queued'
    );
    return {};
  });
}

export function updateSettings(db, session, patch) {
  if (session.role !== 'guardian') return { error: 'forbidden' };
  const next = {};
  if ('paused' in patch) next.paused = !!patch.paused;
  if ('quietHours' in patch) next.quietHours = !!patch.quietHours;
  if ('summarySent' in patch) next.summarySent = !!patch.summarySent;
  if ('recordShared' in patch) next.recordShared = !!patch.recordShared;
  if ('parentGroups' in patch) next.parentGroups = patch.parentGroups || {};
  if ('consent' in patch && patch.consent) {
    const consent = patch.consent.mentor === false ? { ...patch.consent, messages: false } : patch.consent;
    next.consent = consent;
  }
  return transact(db, session.family_id, () => {
    if ('timezone' in patch && patch.timezone) nextTimezone(db, session.family_id, patch.timezone);
    applyPatch(db, session.family_id, next);
    if (patch.consentNote) appendConsent(db, session.family_id, [patch.consentNote]);
    return {};
  });
}

function nextTimezone(db, familyId, timezone) {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format(new Date());
    db.prepare('UPDATE families SET timezone = ? WHERE id = ?').run(timezone, familyId);
  } catch {
    /* ignore an unreadable zone and keep the stored one */
  }
}

export function shareRecord(db, session) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  const state = readState(db, session.family_id);
  if (state.consent?.record === false) return { error: 'record_off' };
  return transact(db, session.family_id, () => {
    applyPatch(db, session.family_id, { recordShared: true });
    return {};
  });
}

export function finishTask(db, session, lessonId) {
  if (session.role !== 'teen') return { error: 'forbidden' };
  if (!lessonId) return { error: 'lesson' };
  const state = readState(db, session.family_id);
  if (state.paused) return { error: 'paused' };
  const lesson = lessons.find((item) => item.id === lessonId);
  return transact(db, session.family_id, () => {
    applyPatch(db, session.family_id, { taskDone: { [lessonId]: true } });
    if (lesson?.club) bumpOrg(db, lesson.club);
    return {};
  });
}

export function acceptClub(db, session) {
  if (session.role !== 'leader' || !session.club_id) return { error: 'forbidden' };
  const closed = listingProblem(db, session.club_id);
  if (closed) return { error: closed };
  const row = db.prepare('SELECT decision FROM club_requests WHERE family_id = ? AND club_id = ?').get(session.family_id, session.club_id);
  if (row?.decision !== 'approved') return { error: 'not_approved' };
  return transact(db, session.family_id, () => {
    db.prepare('UPDATE club_requests SET coach_status = ? WHERE family_id = ? AND club_id = ?').run('accepted', session.family_id, session.club_id);
    db.prepare('UPDATE organizations SET revision = revision + 1 WHERE id = ?').run(session.club_id);
    return {};
  });
}

export function confirmSession(db, session) {
  if (session.role !== 'leader' || !session.club_id) return { error: 'forbidden' };
  const closed = listingProblem(db, session.club_id);
  if (closed) return { error: closed };
  const state = readState(db, session.family_id);
  if (state.decisions?.[session.club_id] !== 'approved' || state.coach?.[session.club_id] !== 'accepted') return { error: 'not_accepted' };
  if (confirmedToday(db, session.family_id, session.club_id, state.timezone)) return { error: 'already_confirmed' };
  return transact(db, session.family_id, () => {
    const written = writeConfirmation(db, { familyId: session.family_id, clubId: session.club_id, by: 'Club leader' });
    if (written.error) throw new Error(written.error);
    return {};
  });
}

export function confirmedToday(db, familyId, clubId, timezone) {
  const zone = timezone || DEFAULT_ZONE;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(new Date());
  const existing = db.prepare('SELECT at FROM attendance WHERE family_id = ? AND club_id = ?').all(familyId, clubId);
  return existing.some((row) => new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(new Date(row.at)) === day);
}

export function rotateInvite(db, session, role, clubId) {
  if (session.role === 'teen' && role !== 'guardian') return { error: 'forbidden' };
  if (session.role === 'guardian' && role !== 'teen' && role !== 'leader') return { error: 'forbidden' };
  if (session.role === 'leader') return { error: 'forbidden' };
  if (role === 'leader') {
    if (!clubId) return { error: 'unknown_club' };
    const row = db.prepare('SELECT decision FROM club_requests WHERE family_id = ? AND club_id = ?').get(session.family_id, clubId);
    if (row?.decision !== 'approved') return { error: 'not_approved' };
  }
  return transact(db, session.family_id, () => ({ invite: insertInvite(db, session.family_id, role, role === 'leader' ? clubId : null) }));
}
