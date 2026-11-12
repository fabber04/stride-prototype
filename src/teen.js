// The child on screen. Skip-and-explore keeps the sample family.
// A finished setup uses the teen saved on the account.

import { childColor, children, clubById, guardianData, myClubs, weekPlan } from './data.js';
import { ageFrom, defaultConsent } from './onboarding.js';

const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isDemo(state) {
  return !state.account;
}

export function consentOf(state) {
  if (state.consent) return state.consent;
  // The sample has every switch on, including sharing the record.
  if (isDemo(state)) return { ...defaultConsent, record: true };
  return defaultConsent;
}

export function teenProfile(state) {
  if (isDemo(state)) {
    return {
      id: 'tino',
      name: 'Tino',
      nickname: 'Tino',
      recordName: 'Tino M.',
      goal: 3,
      interests: [],
      age: null
    };
  }
  const teen = state.account.teen || {};
  const name = (teen.name || '').trim() || 'Teen';
  return {
    id: 'teen',
    name,
    nickname: (teen.nickname || '').trim() || name,
    recordName: name,
    goal: teen.goal || 3,
    interests: teen.interests || [],
    age: ageFrom(teen.dob)
  };
}

export function family(state) {
  if (isDemo(state)) {
    return children.map((kid) => ({ id: kid.id, label: kid.label, color: childColor[kid.id] }));
  }
  const teen = teenProfile(state);
  return [{ id: teen.id, label: teen.name, color: childColor.tino }];
}

export function activeChildId(state) {
  const kids = family(state);
  return kids.some((kid) => kid.id === state.child) ? state.child : kids[0].id;
}

// Messages, reports and lesson tasks belong to the teen, not to a sample sibling.
export function isActiveTeen(state) {
  return activeChildId(state) === teenProfile(state).id;
}

export function joinedClubIds(state) {
  if (isDemo(state)) return myClubs;
  return Object.keys(state.decisions || {}).filter((id) => state.decisions[id] === 'approved' && clubById[id]);
}

function hourIn(state, now) {
  if (!state.account) return now.getHours();
  const part = new Intl.DateTimeFormat('en-GB', {
    timeZone: state.timezone || 'Africa/Johannesburg',
    hour: '2-digit',
    hourCycle: 'h23'
  })
    .formatToParts(now)
    .find((item) => item.type === 'hour');
  const hour = Number(part?.value);
  return Number.isNaN(hour) ? now.getHours() : hour;
}

export function inQuietHours(state, now = new Date()) {
  if (!state.quietHours) return false;
  const hour = hourIn(state, now);
  return hour >= 21 || hour < 7;
}

function rangeOk(club, age) {
  const parts = String(club.range || '')
    .split(/[–-]/)
    .map((part) => Number(part.trim()));
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return false;
  return age >= parts[0] && age <= parts[1];
}

export function ageFits(club, age) {
  if (age == null) return true;
  return rangeOk(club, age);
}

// Null means a new request can be sent. Otherwise the sentence to show the teen.
export function requestBlock(state, club, now = new Date()) {
  if (state.paused) return 'Your guardian paused this account, so new club requests wait.';
  const consent = consentOf(state);
  if (consent.clubs === false) return 'Your guardian has turned off club requests.';
  const age = teenProfile(state).age;
  if (state.account && (age == null || !rangeOk(club, age))) return `This club is for ages ${club.range}.`;
  if (!state.account && !ageFits(club, age)) return `This club is for ages ${club.range}.`;
  if (state.account && age < 13 && consent.childPrivacy !== true) {
    return 'A guardian has to give extra consent because this account is under 13.';
  }
  if (inQuietHours(state, now)) return 'Quiet hours are on, so new club requests wait until morning.';
  return null;
}

export function messageBlock(state, now = new Date()) {
  if (state.paused) return 'Your guardian paused this account, so new messages wait.';
  const consent = consentOf(state);
  if (consent.mentor === false) return 'Your guardian has not allowed a mentor match, so you cannot message one yet.';
  if (consent.messages === false) return 'Your guardian has turned off mentor messages.';
  if (inQuietHours(state, now)) return 'Quiet hours are on, so new messages wait until morning.';
  return null;
}

function asSlots(slot) {
  if (!slot) return [];
  return Array.isArray(slot) ? slot.slice() : [slot];
}

function addRequests(plan, state) {
  const next = {};
  for (const day of dayName) next[day] = asSlots(plan[day]);
  Object.keys(state.requested || {}).forEach((id) => {
    if (!state.requested[id] || state.decisions?.[id] === 'declined') return;
    const club = clubById[id];
    if (!club) return;
    const day = dayName[club.day];
    if (next[day].some((slot) => slot.club === id)) return;
    const approved = state.decisions?.[id] === 'approved';
    const accepted = !state.account || state.coach?.[id] === 'accepted';
    next[day].push({ club: id, pending: !approved || !accepted });
  });
  return next;
}

export function weekForChild(state, childId) {
  if (isDemo(state)) {
    const plan = { ...(weekPlan[childId] || {}) };
    return childId === teenProfile(state).id ? addRequests(plan, state) : plan;
  }
  return addRequests({}, state);
}

export function weekRows(state) {
  return family(state).map((kid) => ({ ...kid, plan: weekForChild(state, kid.id) }));
}

export function childSummary(state, childId) {
  if (isDemo(state)) return guardianData[childId];
  const teen = teenProfile(state);
  const ids = joinedClubIds(state);
  const confirmed = (state.attendance || []).length;
  return {
    confirmed,
    goal: teen.goal,
    clubs: ids,
    message: confirmed
      ? `${confirmed} session${confirmed === 1 ? '' : 's'} confirmed by a club leader.`
      : ids.length
        ? 'Approved clubs are on the week. A club leader still confirms each session.'
        : 'No sessions confirmed yet.',
    sessions: ids.map((id) => {
      const club = clubById[id];
      return {
        name: club.name,
        detail: `${club.short} · approved, waiting for the ${club.confirmer.toLowerCase()} to confirm`
      };
    })
  };
}

export function preferInterests(list, interests) {
  if (!interests?.length) return list;
  return [...list].sort(
    (a, b) => Number(!interests.includes(a.type)) - Number(!interests.includes(b.type))
  );
}
