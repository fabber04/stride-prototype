import { useCallback, useState } from 'react';
import { useStore } from '../../store.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { defaultConsent } from '../../onboarding.js';
import Welcome from './Welcome.jsx';
import SignIn from './SignIn.jsx';
import TeenSetup from './TeenSetup.jsx';
import { Adult, AgeCheck, InviteGuardian, TooYoung, Waiting } from './TeenSteps.jsx';
import { Activated, ChildProfile, ConsentStep, GuardianAccount, VerifyGuardian, suggestLogin } from './GuardianSteps.jsx';

const emptyDraft = {
  dob: '',
  teenName: '',
  inviteContact: '',
  guardianName: '',
  guardianContact: '',
  password: '',
  relation: '',
  method: '',
  verifiedAt: null,
  consent: defaultConsent,
  quietHours: true,
  login: '',
  loginEdited: false,
  pin: '',
  teenId: null,
  interests: [],
  goal: 2,
  nickname: ''
};

/**
 * Guardian-first onboarding. A teen can start, but nothing unlocks until a verified guardian consents.
 * mode="addTeen" is for a guardian who is already signed in: permissions, then the teen's profile.
 */
export default function Onboarding({ mode }) {
  const { state, set } = useStore();
  const { api, user } = useBackend();
  const adding = mode === 'addTeen';
  const invite = adding ? null : state.pendingInvite;
  const [draft, setDraft] = useState(() =>
    invite ? { ...emptyDraft, teenName: invite.teenName, dob: invite.dob, nickname: invite.teenName, login: suggestLogin(invite.teenName) } : emptyDraft
  );
  const [history, setHistory] = useState([adding ? 'consent' : invite ? 'waiting' : 'welcome']);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const step = history[history.length - 1];

  const update = useCallback((patch) => setDraft((prev) => ({ ...prev, ...patch })), []);
  const go = (next) => {
    setError(null);
    setHistory((prev) => [...prev, next]);
    window.scrollTo(0, 0);
  };
  const back = () => {
    setError(null);
    if (adding && history.length === 1) {
      set({ setup: null });
      window.location.hash = '#/guardian';
      return;
    }
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };
  const restart = () => {
    set({ pendingInvite: null });
    setDraft(emptyDraft);
    setHistory(['welcome']);
  };
  const leave = (route) => {
    window.location.hash = route;
    set({ setup: null, pendingInvite: null });
  };

  // Creates the guardian (unless one is signed in) and the teen. `setup` keeps this screen up
  // while the session changes underneath it.
  const activate = async () => {
    setBusy(true);
    setError(null);
    set({ setup: { mode: mode || 'new' } });
    const message = await attempt(
      (async () => {
        if (!user || user.role !== 'guardian') {
          await api.registerGuardian({
            name: draft.guardianName,
            contact: draft.guardianContact,
            relation: draft.relation,
            password: draft.password,
            verifiedBy: draft.method,
            verifiedAt: draft.verifiedAt
          });
        }
        const teenId = await api.createTeen({
          name: draft.teenName,
          dob: draft.dob,
          login: draft.login,
          pin: draft.pin,
          consent: draft.consent,
          quietHours: draft.quietHours
        });
        update({ teenId, nickname: draft.nickname || draft.teenName.trim() });
      })()
    );
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    set({ pendingInvite: null });
    setHistory(['activated']);
  };

  const handOver = async () => {
    const message = await attempt(api.handOver(draft.teenId));
    if (message) setError(message);
    else go('teenSetup');
  };

  const finishTeen = async () => {
    setBusy(true);
    const message = await attempt(api.updateTeenProfile({ nickname: draft.nickname, interests: draft.interests, goal: draft.goal }));
    setBusy(false);
    if (message) setError(message);
    else leave('#/today');
  };

  const props = { draft, update, go, back };

  switch (step) {
    case 'signIn':
      return <SignIn back={back} />;
    case 'age':
      return <AgeCheck {...props} />;
    case 'young':
      return <TooYoung back={back} restart={restart} />;
    case 'adult':
      return <Adult back={back} go={go} />;
    case 'invite':
      return (
        <InviteGuardian
          {...props}
          onSend={() => {
            set({
              pendingInvite: {
                teenName: draft.teenName.trim(),
                dob: draft.dob,
                contact: draft.inviteContact.trim(),
                sentAt: new Date().toISOString()
              }
            });
            update({ nickname: draft.teenName.trim(), login: suggestLogin(draft.teenName) });
            setHistory(['waiting']);
          }}
        />
      );
    case 'waiting':
      return <Waiting invite={state.pendingInvite} onOpenInvite={() => go('account')} onCancel={restart} />;
    case 'account':
      return <GuardianAccount {...props} invite={invite} />;
    case 'verify':
      return <VerifyGuardian {...props} />;
    case 'consent':
      return <ConsentStep {...props} step={adding ? 1 : 3} total={adding ? 2 : 4} onAgree={() => go('child')} />;
    case 'child':
      return <ChildProfile {...props} step={adding ? 2 : 4} total={adding ? 2 : 4} onActivate={activate} error={error} busy={busy} />;
    case 'activated':
      return <Activated draft={draft} error={error} onHandOver={handOver} onDashboard={() => leave('#/guardian')} />;
    case 'teenSetup':
      return <TeenSetup draft={draft} update={update} onDone={finishTeen} error={error} busy={busy} />;
    default:
      return <Welcome go={go} />;
  }
}
