// Date helpers. Dates are stored as local calendar days ('YYYY-MM-DD'); weeks run Monday to Sunday.

const pad = (n) => String(n).padStart(2, '0');

export function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIso(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return next;
}

export function weekStart(date) {
  const offset = (date.getDay() + 6) % 7; // Monday = 0
  return addDays(date, -offset);
}

export function weekKey(date) {
  return isoDate(weekStart(date));
}

// The most recent session on weekday `day` (0 = Sunday), today included.
export function lastSessionDate(day, today = new Date()) {
  return addDays(today, -((today.getDay() - day + 7) % 7));
}

// The next `count` sessions on weekday `day`, today included.
export function nextSessionDates(day, count = 2, today = new Date()) {
  const first = addDays(today, (day - today.getDay() + 7) % 7);
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7));
}

export function formatDay(value) {
  const date = typeof value === 'string' && value.length === 10 ? fromIso(value) : new Date(value);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatShort(value) {
  const date = typeof value === 'string' && value.length === 10 ? fromIso(value) : new Date(value);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
}

// "10:42", "Yesterday", "Mon", or "3 Nov" depending on how long ago.
export function formatWhenShort(value, now = new Date()) {
  const date = new Date(value);
  const days = Math.round((weekStart(now) - weekStart(date)) / 86400000);
  if (isoDate(date) === isoDate(now)) return formatTime(value);
  if (isoDate(date) === isoDate(addDays(now, -1))) return 'Yesterday';
  if (days === 0) return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return formatShort(value);
}
