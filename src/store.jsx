import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

// One shared store so choices survive moving between screens.
// A signed-in family lives in the Stride database. Each phone has its own role,
// and safety changes go through the server instead of a whole-state save.
const StoreContext = createContext(null);

const SAVED_KEYS = [
  'onboarded',
  'account',
  'consent',
  'consentLog',
  'pendingInvite',
  'paused',
  'quietHours',
  'requested',
  'decisions',
  'coach',
  'skipped',
  'messages',
  'reports',
  'taskDone',
  'taskConfirmed',
  'recordShared',
  'summarySent',
  'parentGroups',
  'attendance',
  'timezone'
];
const STORAGE_KEY = 'stride-account';
const SESSION_KEY = 'stride-session';

const initialState = {
  clubFilter: 'All',
  clubSearch: '',
  requested: { coders: true },
  decisions: {},
  coach: {},
  messages: [],
  reports: [],
  saved: { python: true, chess: true, voice: true },
  playing: {},
  taskDone: {},
  taskConfirmed: {},
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
  quietHours: true,
  attendance: [],
  timezone: 'Africa/Johannesburg'
};

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function rememberSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function zone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Johannesburg';
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => ({ ...initialState, ...loadSaved() }));
  const [org, setOrg] = useState(null);
  const [session, setSession] = useState(loadSession);
  const [ready, setReady] = useState(() => !loadSession());
  const stateRef = useRef(state);
  const sessionRef = useRef(session);
  const revisionRef = useRef(0);
  stateRef.current = state;
  sessionRef.current = session;

  const applySaved = useCallback((saved) => {
    if (!saved) return;
    setState((prev) => {
      const next = { ...prev };
      for (const key of SAVED_KEYS) if (key in saved) next[key] = saved[key];
      stateRef.current = next;
      return next;
    });
  }, []);

  const set = useCallback((patch) => {
    const prev = stateRef.current;
    const nextPatch = typeof patch === 'function' ? patch(prev) : patch;
    const next = { ...prev, ...nextPatch };
    stateRef.current = next;
    setState(next);
  }, []);

  const keep = useCallback(
    (result) => {
      if (result.scope === 'org') {
        const current = sessionRef.current?.scope === 'org' ? sessionRef.current : {};
        const invites = { ...(current.invites || {}) };
        if (result.invite) invites[`${result.invite.role}:${result.invite.mentorId || 'staff'}`] = result.invite;
        const nextSession = {
          token: result.token || current.token,
          role: result.role || current.role,
          scope: 'org',
          clubId: result.clubId || current.clubId,
          mentorId: result.mentorId ?? current.mentorId ?? null,
          invites
        };
        sessionRef.current = nextSession;
        if (result.revision) revisionRef.current = result.revision;
        rememberSession(nextSession);
        setSession(nextSession);
        if (result.org) setOrg(result.org);
        return result;
      }
      const current = sessionRef.current?.scope === 'org' ? {} : sessionRef.current || {};
      const invites = { ...(current.invites || {}) };
      if (result.invite) invites[result.invite.role] = result.invite;
      const nextSession = {
        token: result.token || current.token,
        role: result.role || current.role,
        scope: 'family',
        clubId: result.clubId ?? current.clubId ?? null,
        invites
      };
      sessionRef.current = nextSession;
      if (result.revision) revisionRef.current = result.revision;
      rememberSession(nextSession);
      setSession(nextSession);
      setOrg(null);
      applySaved(result.state);
      return result;
    },
    [applySaved]
  );

  const act = useCallback(
    async (path, { method = 'POST', body } = {}) => {
      const result = await api(path, { method, body, token: sessionRef.current?.token });
      return keep(result);
    },
    [keep]
  );

  const startFamily = useCallback(
    async (role, patch) => {
      localStorage.removeItem('stride-teen-setup');
      return keep(await api('/api/families', { method: 'POST', body: { role, state: patch, timezone: zone() } }));
    },
    [keep]
  );

  const joinFamily = useCallback(
    async (code) => keep(await api('/api/families/join', { method: 'POST', body: { code } })),
    [keep]
  );

  const saveSetup = useCallback(
    async (patch) => {
      if (!sessionRef.current) return startFamily('guardian', patch);
      return act('/api/setup', { body: patch });
    },
    [act, startFamily]
  );

  const disconnect = useCallback(() => {
    sessionRef.current = null;
    rememberSession(null);
    setSession(null);
  }, []);

  const leaveFamily = useCallback(() => {
    disconnect();
    const next = { ...stateRef.current, pendingInvite: null };
    stateRef.current = next;
    setState(next);
  }, [disconnect]);

  const exploreDemo = useCallback(() => {
    disconnect();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('stride-teen-setup');
    const next = { ...initialState, onboarded: true };
    stateRef.current = next;
    setState(next);
  }, [disconnect]);

  const reset = useCallback(async () => {
    const current = sessionRef.current;
    disconnect();
    if (current) {
      try {
        await api('/api/family', { method: 'DELETE', token: current.token });
      } catch {
        // This phone still forgets the account if the database is unreachable.
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('stride-teen-setup');
    const next = { ...initialState };
    stateRef.current = next;
    setState(next);
  }, [disconnect]);

  useEffect(() => {
    const existing = sessionRef.current;
    if (!existing) return undefined;
    let cancel = false;
    const path = existing.scope === 'org' ? '/api/org' : '/api/state';
    api(path, { token: existing.token })
      .then((remote) => {
        if (cancel) return;
        revisionRef.current = remote.revision;
        if (existing.scope === 'org') {
          keep({
            scope: 'org',
            token: existing.token,
            role: remote.role || existing.role,
            clubId: remote.clubId || existing.clubId,
            mentorId: remote.mentorId ?? existing.mentorId,
            revision: remote.revision,
            org: remote.org,
            invites: existing.invites
          });
        } else {
          keep({ ...existing, role: remote.role || existing.role, clubId: remote.clubId ?? existing.clubId, revision: remote.revision, state: remote.state });
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [keep]);

  useEffect(() => {
    if (!ready || !session) return undefined;
    const pull = async () => {
      if (!sessionRef.current) return;
      try {
        const current = sessionRef.current;
        const remote = await api(current.scope === 'org' ? '/api/org' : '/api/state', { token: current.token });
        if (remote.revision === revisionRef.current) return;
        revisionRef.current = remote.revision;
        if (current.scope === 'org') setOrg(remote.org);
        else applySaved(remote.state);
      } catch (error) {
        if (error.status === 404 || error.status === 401) {
          const wasOrg = sessionRef.current?.scope === 'org';
          disconnect();
          setOrg(null);
          if (!wasOrg) {
            const next = { ...initialState };
            stateRef.current = next;
            setState(next);
          }
        }
      }
    };
    const id = setInterval(pull, 2000);
    return () => clearInterval(id);
  }, [applySaved, disconnect, ready, session]);

  useEffect(() => {
    if (sessionRef.current?.scope === 'org') return;
    const saved = Object.fromEntries(SAVED_KEYS.map((key) => [key, state[key]]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [state, session]);

  const value = {
    state,
    org,
    set,
    reset,
    session,
    ready,
    startFamily,
    joinFamily,
    saveSetup,
    exploreDemo,
    leaveFamily,
    requestClub: (clubId) => act('/api/requests', { body: { clubId } }),
    withdrawRequest: (clubId) => act(`/api/requests/${encodeURIComponent(clubId)}`, { method: 'DELETE' }),
    decideClub: (clubId, decision) => act(`/api/requests/${encodeURIComponent(clubId)}/decision`, { body: { decision } }),
    sendMessage: (to, text) => act('/api/messages', { body: { to, text } }),
    releaseMessage: (id, status) => act(`/api/messages/${encodeURIComponent(id)}`, { body: { status } }),
    sendReport: (reason) => act('/api/reports', { body: { reason } }),
    updateSettings: (patch) => act('/api/settings', { body: patch }),
    shareRecord: () => act('/api/share'),
    finishTask: (lessonId) => act('/api/tasks', { body: { lessonId } }),
    acceptClub: () => act('/api/leader/accept'),
    confirmSession: () => act('/api/leader/confirm'),
    saveProfile: (profile) => act('/api/profile', { body: profile }),
    inviteFor: (role, clubId) => act('/api/invites', { body: { role, clubId } }),
    openClub: (clubId) => act('/api/orgs/open', { body: { clubId } }),
    acceptMember: (familyId) => act('/api/org/accept', { body: { familyId } }),
    confirmMember: (familyId) => act('/api/org/confirm', { body: { familyId } }),
    mintStaff: (role, mentorId) => act('/api/org/invites', { body: { role, mentorId } }),
    confirmMentorTask: (familyId, lessonId) => act('/api/org/tasks', { body: { familyId, lessonId } })
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
