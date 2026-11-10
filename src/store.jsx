import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Per-device UI state only. Accounts and everything shared live in the backend (src/api).
const StoreContext = createContext(null);

const SAVED_KEYS = ['pendingInvite', 'saved', 'parentGroups'];
const STORAGE_KEY = 'stride-device';

const initialState = {
  clubFilter: 'All',
  clubSearch: '',
  saved: { python: true, chess: true, voice: true },
  playing: {},
  child: null, // which teen a guardian is looking at
  summarySent: false,
  parentGroups: {},
  skipped: {},
  learnFilter: 'All',
  recordShared: false,
  pendingInvite: null,
  setup: null // { mode } while onboarding runs, so it survives the session changing mid-flow
};

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return Object.fromEntries(SAVED_KEYS.filter((k) => k in saved).map((k) => [k, saved[k]]));
  } catch {
    return {};
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => ({ ...initialState, ...loadSaved() }));
  const set = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(SAVED_KEYS.map((k) => [k, state[k]]))));
    } catch {
      // private mode: nothing to keep
    }
  }, [state.pendingInvite, state.saved, state.parentGroups]);

  return <StoreContext.Provider value={{ state, set }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
