const base = import.meta.env.VITE_API_URL || '';

export async function api(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    const error = new Error('offline');
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function explain(error, club) {
  const code = error?.message || error;
  const text = {
    paused: 'Your guardian paused this account, so that has to wait.',
    clubs_off: 'Club requests are turned off. Your guardian can turn them back on.',
    age: club ? `This club is for ages ${club.range}.` : 'The date of birth is missing or outside 12 to 17.',
    quiet: 'It is quiet hours (9 pm to 7 am), so that waits until morning.',
    child_privacy: 'A guardian has to give extra consent because this account is under 13.',
    mentor_off: 'Mentor matching is turned off, so messages stay closed.',
    messages_off: 'Messages are turned off. Your guardian can turn them back on.',
    forbidden: 'That action belongs to the other phone.',
    expired: 'That code has expired. Ask for a new one.',
    unknown: 'That code does not match a family or a club.',
    claimed: 'This club already has an owner. Ask them for a staff code.',
    suspended: 'This club listing is suspended, so new sessions wait.',
    unknown_mentor: 'That mentor is not on the list.',
    lesson: 'That lesson is not waiting for this mentor.',
    rate_limited: 'Too many tries. Wait a few minutes and ask for a new code.',
    account: 'The guardian and teen names are still needed.',
    consent: 'The account consent is required.',
    decided: 'Your guardian already answered this request.',
    record_off: 'Sharing the growth record is turned off.',
    not_approved: 'A guardian has to approve this club first.',
    not_accepted: 'The club leader has to accept the teen first.',
    already_confirmed: 'Today’s session is already confirmed.',
    offline: 'The family database is not reachable from this phone.'
  };
  return text[code] || 'That could not be saved.';
}
