// The only data layer. Screens call useBackend() and never touch storage directly.
// VITE_STRIDE_BACKEND=server uses /api/rpc (Supabase behind it); anything else keeps the
// database in this browser's localStorage, which is how the static demo build works.
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { createLocalBackend } from './local.js';
import { createRemoteBackend } from './remote.js';
import { currentUser } from './selectors.js';

export const backendKind = import.meta.env.VITE_STRIDE_BACKEND === 'server' ? 'server' : 'local';

let shared;
export function getBackend() {
  shared ||= backendKind === 'server' ? createRemoteBackend() : createLocalBackend();
  return shared;
}

const BackendContext = createContext(null);

export function BackendProvider({ backend = getBackend(), children }) {
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}

export function useBackend() {
  const api = useContext(BackendContext);
  const snapshot = useSyncExternalStore(api.subscribe, api.getSnapshot);
  const user = useMemo(() => currentUser(snapshot.db, snapshot.session), [snapshot.db, snapshot.session]);
  return { db: snapshot.db, session: snapshot.session, ready: snapshot.ready, error: snapshot.error, user, api };
}

/** Runs a backend call; returns the error message to show, or null when it worked. */
export async function attempt(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error?.message || 'Something went wrong. Try again.';
  }
}
