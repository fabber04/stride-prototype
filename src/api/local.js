// The database in localStorage. Used when no server is configured (the static demo build),
// and by the tests. Every rule lives in rules.js, which the server backend runs too.
import { ApiError, applyMethod, methodNames } from './rules.js';
import { DB_VERSION, createSeed, hashSecret } from './seed.js';

export const DB_KEY = 'stride-db';
export const SESSION_KEY = 'stride-session';

export function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k)
  };
}

function safeStorage(storage) {
  if (storage) return storage;
  try {
    const probe = '__stride_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

function read(storage, key) {
  try {
    return JSON.parse(storage.getItem(key));
  } catch {
    return null;
  }
}

const verifySecret = (secret, stored) => hashSecret(secret) === stored;

export function createLocalBackend({ storage, now = () => new Date() } = {}) {
  const store = safeStorage(storage);
  let db = read(store, DB_KEY);
  if (!db || db.version !== DB_VERSION) {
    db = createSeed(now());
    store.setItem(DB_KEY, JSON.stringify(db));
    store.removeItem(SESSION_KEY);
  }
  let session = read(store, SESSION_KEY);
  if (session && !db.users[session.userId]) session = null;
  let snapshot = { db, session, ready: true, error: null };
  const listeners = new Set();

  const publish = () => {
    snapshot = { db, session, ready: true, error: null };
    listeners.forEach((fn) => fn());
  };

  const setSession = (next) => {
    session = next;
    if (next) store.setItem(SESSION_KEY, JSON.stringify(next));
    else store.removeItem(SESSION_KEY);
  };

  // Every write: copy, apply, save, notify.
  function commit(method, args) {
    const next = structuredClone(db);
    const result = applyMethod(next, method, args, {
      userId: session?.userId,
      now: now(),
      hash: hashSecret,
      verify: verifySecret
    });
    db = next;
    store.setItem(DB_KEY, JSON.stringify(db));
    if (result.session !== undefined) setSession(result.session);
    publish();
    return result.value;
  }

  const api = {
    kind: 'local',
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async refresh() {
      return snapshot;
    },
    async resetDemo() {
      db = createSeed(now());
      store.setItem(DB_KEY, JSON.stringify(db));
      setSession(null);
      publish();
      return null;
    }
  };
  for (const name of methodNames) {
    api[name] = async (...args) => commit(name, args);
  }
  return api;
}

export { ApiError };
