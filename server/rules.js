import { clubs } from '../src/data.js';
import { ageFrom, MAX_AGE, MIN_AGE } from '../src/onboarding.js';
import { screenMessage } from '../src/records.js';

export const DEFAULT_ZONE = 'Africa/Johannesburg';
const clubById = Object.fromEntries(clubs.map((club) => [club.id, club]));

export function clubOf(id) {
  return clubById[id] || null;
}

export function zoneHour(timeZone, now = new Date()) {
  const part = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone || DEFAULT_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  })
    .formatToParts(now)
    .find((item) => item.type === 'hour');
  const hour = Number(part?.value);
  return Number.isNaN(hour) ? now.getUTCHours() : hour;
}

export function quietNow(state, now = new Date()) {
  if (!state.quietHours) return false;
  const hour = zoneHour(state.timezone, now);
  return hour >= 21 || hour < 7;
}

function ageFits(club, age) {
  const parts = String(club.range || '')
    .split(/[–-]/)
    .map((part) => Number(part.trim()));
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return false;
  return age >= parts[0] && age <= parts[1];
}

export function requestRefusal(state, club, now = new Date()) {
  if (!club) return 'unknown_club';
  if (state.paused) return 'paused';
  if (state.consent?.clubs === false) return 'clubs_off';
  const age = ageFrom(state.account?.teen?.dob);
  if (age == null || !ageFits(club, age)) return 'age';
  if (age < 13 && state.consent?.childPrivacy !== true) return 'child_privacy';
  if (quietNow(state, now)) return 'quiet';
  return null;
}

export function messageRefusal(state, now = new Date()) {
  if (state.paused) return 'paused';
  if (state.consent?.mentor === false) return 'mentor_off';
  if (state.consent?.messages === false) return 'messages_off';
  if (quietNow(state, now)) return 'quiet';
  return null;
}

export function setupRefusal(patch) {
  const age = ageFrom(patch.account?.teen?.dob);
  if (age == null || age < MIN_AGE || age > MAX_AGE) return 'age';
  if (!patch.account?.guardian?.name || !patch.account?.teen?.name) return 'account';
  if (patch.consent?.account === false) return 'consent';
  if (age < 13 && patch.consent?.childPrivacy !== true) return 'child_privacy';
  return null;
}

export function screen(text) {
  return screenMessage(text);
}
