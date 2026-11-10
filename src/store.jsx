import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// One shared store so choices survive moving between screens
// (a club request made in Clubs shows up in the Guardian view).
const StoreContext = createContext(null);

// Account and consent survive a reload; everything else is demo state that resets.
const SAVED_KEYS = ['onboarded', 'account', 'consent', 'consentLog', 'pendingInvite', 'paused', 'quietHours'];
const STORAGE_KEY = 'stride-account';

const initialState = {
  clubFilter: 'All',
  clubSearch: '',
  requested: { coders: true },
  decisions: {},
  saved: { python: true, chess: true, voice: true },
  playing: {},
  taskDone: {},
  child: 'tino',
  summarySent: false,
  parentGroups: {},
  skipped: {},
  learnFilter: 'All',
  steps: {},
  recordShared: false,
  onboarded: false,
  account: null,
  consent: null,
  consentLog: [],
  pendingInvite: null,
  paused: false,
  quietHours: true
};

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
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
    const saved = Object.fromEntries(SAVED_KEYS.map((key) => [key, state[key]]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [state]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  return <StoreContext.Provider value={{ state, set, reset }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
