// The server backend, seen from the browser. Same interface as local.js, but every call goes to
// POST /api/rpc, which runs the rules on the server and keeps the data in Supabase.
import { ApiError, methodNames } from './rules.js';

const TOKEN_KEY = 'stride-token';
const POLL_MS = 20000;

function tokenStore() {
  try {
    window.localStorage.setItem('__stride_probe__', '1');
    window.localStorage.removeItem('__stride_probe__');
    return window.localStorage;
  } catch {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  }
}

export function createRemoteBackend({ endpoint = '/api/rpc', fetchImpl = (...a) => fetch(...a) } = {}) {
  const store = tokenStore();
  let snapshot = { db: null, session: null, ready: false, error: null };
  const listeners = new Set();
  const publish = (next) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };

  async function call(method, args = []) {
    const token = store.getItem(TOKEN_KEY);
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ method, args })
      });
    } catch {
      throw new ApiError("Can't reach Stride. Check your connection and try again.", 0);
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && method === 'snapshot') store.removeItem(TOKEN_KEY);
      throw new ApiError(body.error || 'Something went wrong. Try again.', response.status);
    }
    if ('token' in body) {
      if (body.token) store.setItem(TOKEN_KEY, body.token);
      else store.removeItem(TOKEN_KEY);
    }
    if (body.snapshot) publish({ ...body.snapshot, ready: true, error: null });
    return body.value;
  }

  const api = {
    kind: 'server',
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async refresh() {
      try {
        await call('snapshot');
      } catch (error) {
        if (!snapshot.ready) publish({ ...snapshot, error: error.message });
      }
      return snapshot;
    },
    resetDemo: () => call('resetDemo')
  };
  for (const name of methodNames) api[name] = (...args) => call(name, args);

  if (typeof window !== 'undefined') {
    api.refresh();
    // Pick up new messages, approvals and confirmations made on other phones.
    setInterval(() => {
      if (document.visibilityState === 'visible' && snapshot.session) api.refresh();
    }, POLL_MS);
    window.addEventListener('focus', () => snapshot.ready && api.refresh());
  }
  return api;
}
