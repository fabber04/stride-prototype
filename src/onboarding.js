// Rules for guardian-first onboarding. See OnboardingArch in the project folder for the flow.

export const MIN_AGE = 12;
export const MAX_AGE = 17;

// Bump when the consent wording changes, so the log shows which version each guardian agreed to.
export const POLICY_VERSION = '2026-11';

// `needs` hides a switch until the one it depends on is on (no messages without a mentor).
export const consentItems = [
  {
    id: 'account',
    required: true,
    title: 'Account and weekly plan',
    detail: (name) => `${name} gets a Stride account and a weekly plan. Needed to use Stride.`
  },
  {
    id: 'childPrivacy',
    under13: true,
    title: 'Extra consent under 13',
    detail: (name) => `${name} is under 13. You confirm you are their parent or legal guardian and you agree to this account on their behalf.`
  },
  {
    id: 'clubs',
    title: 'Ask to join clubs',
    detail: (name) => `${name} can ask to join verified clubs. You approve every request.`
  },
  {
    id: 'mentor',
    title: 'A checked mentor',
    detail: (name) => `Match ${name} with a mentor who passed ID and safeguarding checks.`
  },
  {
    id: 'messages',
    needs: 'mentor',
    title: 'Messages with the mentor',
    detail: () => 'Messages stay inside Stride and you can read every one.'
  },
  {
    id: 'record',
    title: 'Share the growth record',
    detail: (name) => `${name} can share confirmed sessions and badges with a school.`
  },
  {
    id: 'summary',
    title: 'Weekly summary on WhatsApp',
    detail: () => 'A weekly summary is saved for you. WhatsApp is not connected yet.'
  }
];

export const defaultConsent = { account: true, clubs: true, mentor: true, messages: true, record: false, summary: true };

export const verifyMethods = [
  { id: 'id', title: 'ID and a selfie', detail: 'National ID or passport, then a quick selfie. About 2 minutes.' },
  { id: 'card', title: 'Card check', detail: 'A $0.50 hold on a bank or mobile money card, refunded straight away.' }
];

export const relations = ['Mother', 'Father', 'Grandparent', 'Aunt or uncle', 'Legal guardian', 'Other'];

export function ageFrom(dob, today = new Date()) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function ageBand(age) {
  if (age === null) return null;
  if (age < MIN_AGE) return 'young';
  if (age > MAX_AGE) return 'adult';
  return 'teen';
}

export function consentEntry(by, choices, note) {
  return { at: new Date().toISOString(), by, version: POLICY_VERSION, choices, note };
}

export function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
