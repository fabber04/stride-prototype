import { createContext, useCallback, useContext, useState } from 'react';

// One shared store so choices survive moving between screens
// (a club request made in Clubs shows up in the Guardian view).
const StoreContext = createContext(null);

const initialState = {
  checkedIn: false,
  clubFilter: 'All',
  requested: { coders: true },
  saved: { python: true },
  playing: {},
  child: 'tino',
  decision: 'pending',
  digest: true
};

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState);
  const set = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);
  return <StoreContext.Provider value={{ state, set }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
