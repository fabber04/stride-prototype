// How each collection maps to a Postgres table (see supabase/migrations/0001_stride.sql).
// Fields listed here get their own column (camelCase becomes snake_case); any other field is kept
// in the row's `extra` jsonb column, so display copy can change without a migration.

export const tables = {
  users: ['id', 'role', 'login', 'secret', 'name', 'createdAt', 'contact', 'relation', 'verifiedBy', 'verifiedAt', 'surname', 'nickname', 'dob', 'guardianId', 'mentorId', 'color', 'interests', 'goal', 'routine', 'paused', 'quietHours', 'consent', 'consentLog'],
  mentors: ['id', 'userId', 'listed', 'name', 'short', 'first', 'initials', 'photo', 'avatar', 'role', 'badge'],
  clubs: ['id', 'mentorId', 'name', 'type', 'day', 'time', 'cost', 'spots'],
  lessons: ['id', 'mentorId', 'club', 'type', 'title', 'minutes', 'task', 'steps', 'badge', 'image', 'videoUrl', 'createdAt'],
  memberships: ['id', 'teenId', 'clubId', 'since', 'requestId'],
  requests: ['id', 'teenId', 'clubId', 'status', 'createdAt', 'decidedAt', 'decidedBy'],
  attendance: ['id', 'teenId', 'clubId', 'date', 'confirmedBy', 'at'],
  tasks: ['id', 'teenId', 'lessonId', 'steps', 'status', 'submittedAt', 'reviewedAt', 'reviewedBy', 'note'],
  badges: ['id', 'teenId', 'name', 'mentorId', 'clubId', 'lessonId', 'at'],
  messages: ['id', 'teenId', 'mentorId', 'from', 'text', 'at', 'readAt'],
  reports: ['id', 'by', 'role', 'teenId', 'mentorId', 'reason', 'text', 'at', 'status']
};

// Writes go parents first; deletes go children first.
export const writeOrder = Object.keys(tables);

// Field names that are awkward as SQL column names.
const renamed = { from: 'sender', by: 'reporter_id' };
const timestamps = new Set(['createdAt', 'verifiedAt', 'decidedAt', 'at', 'submittedAt', 'reviewedAt', 'readAt']);

export const columnOf = (field) => renamed[field] || field.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);

export function toRow(table, obj) {
  const row = { extra: {} };
  const fields = new Set(tables[table]);
  for (const field of fields) row[columnOf(field)] = obj[field] === undefined ? null : obj[field];
  for (const [key, value] of Object.entries(obj)) {
    if (!fields.has(key) && value !== undefined) row.extra[key] = value;
  }
  return row;
}

export function fromRow(table, row) {
  const obj = { ...(row.extra || {}) };
  for (const field of tables[table]) {
    let value = row[columnOf(field)];
    if (value === null || value === undefined) continue;
    if (timestamps.has(field)) value = new Date(value).toISOString();
    obj[field] = value;
  }
  return obj;
}
