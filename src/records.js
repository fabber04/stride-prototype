// Records the guardian must be able to read. A linked family stores them in the database.

const flags = [
  [/whats?\s*app|telegram|instagram|snapchat|tiktok|facebook/i, 'asks to leave Stride'],
  [/\b\d{7,}\b/, 'includes a phone number'],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, 'includes an email address'],
  [/don'?t tell|do not tell|keep this (a )?secret/i, 'asks to keep a secret'],
  [/meet( me)? alone|meet outside|my address|come over|pick you up/i, 'asks to meet outside a club']
];

export function screenMessage(text) {
  const hit = flags.find(([pattern]) => pattern.test(text));
  return hit ? hit[1] : null;
}

export function messageRecord({ from, to, text }) {
  const flag = screenMessage(text);
  return {
    id: `m-${Date.now()}`,
    at: new Date().toISOString(),
    from,
    to,
    text: text.trim(),
    status: flag ? 'held' : 'sent',
    flag
  };
}

export function reportRecord({ by, reason }) {
  return {
    id: `r-${Date.now()}`,
    at: new Date().toISOString(),
    by,
    reason,
    status: 'with the safeguarding lead'
  };
}
