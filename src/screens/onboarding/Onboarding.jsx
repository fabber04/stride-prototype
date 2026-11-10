import { useCallback, useState } from 'react';
import { useStore } from '../../store.jsx';
import { consentEntry, defaultConsent } from '../../onboarding.js';
import Welcome from './Welcome.jsx';
import TeenSetup from './TeenSetup.jsx';
import { Adult, AgeCheck, InviteGuardian, TooYoung, Waiting } from './TeenSteps.jsx';
import { Activated, ChildProfile, ConsentStep, GuardianAccount, VerifyGuardian } from './GuardianSteps.jsx';

const emptyDraft = {
  dob: '',
  teenName: '',
  inviteContact: '',
  guardianName: '',
  guardianContact: '',
  relation: '',
  method: '',
  verifiedAt: null,
  consent: defaultConsent,
  quietHours: true,
  interests: [],
  goal: 3,
  nickname: ''
};

// Guardian-first onboarding. A teen can start, but nothing unlocks until a verified guardian consents.
export default function Onboarding() {
  const { state, set } = useStore();
  const invite = state.pendingInvite;
  const [draft, setDraft] = useState(() =>
    invite ? { ...emptyDraft, teenName: invite.teenName, dob: invite.dob, nickname: invite.teenName } : emptyDraft
  );
  const [history, setHistory] = useState([invite ? 'waiting' : 'welcome']);
  const step = history[history.length - 1];

  const update = useCallback((patch) => setDraft((prev) => ({ ...prev, ...patch })), []);
  const go = (next) => {
    setHistory((prev) => [...prev, next]);
    window.scrollTo(0, 0);
  };
  const back = () => setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const restart = () => {
    set({ pendingInvite: null });
    setDraft(emptyDraft);
    setHistory(['welcome']);
  };

  const finish = (route) => {
    set((prev) => ({
      onboarded: true,
      pendingInvite: null,
      quietHours: draft.quietHours,
      account: {
        guardian: {
          name: draft.guardianName.trim(),
          contact: draft.guardianContact.trim(),
          relation: draft.relation,
          verifiedBy: draft.method,
          verifiedAt: draft.verifiedAt
        },
        teen: {
          name: draft.teenName.trim(),
          dob: draft.dob,
          nickname: draft.nickname.trim() || draft.teenName.trim(),
          interests: draft.interests,
          goal: draft.goal
        }
      },
      consent: prev.consent ?? draft.consent
    }));
    window.location.hash = route;
  };

  const props = { draft, update, go, back };

  switch (step) {
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
            update({ nickname: draft.teenName.trim() });
            setHistory(['waiting']);
          }}
        />
      );
    case 'waiting':
      return <Waiting invite={invite} onOpenInvite={() => go('account')} onCancel={restart} />;
    case 'account':
      return <GuardianAccount {...props} invite={invite} />;
    case 'verify':
      return <VerifyGuardian {...props} />;
    case 'consent':
      return (
        <ConsentStep
          {...props}
          onAgree={() => {
            set((prev) => ({
              consent: draft.consent,
              consentLog: [...prev.consentLog, consentEntry(draft.guardianName.trim(), draft.consent, 'Initial consent')]
            }));
            go('child');
          }}
        />
      );
    case 'child':
      return <ChildProfile {...props} onActivate={() => setHistory(['activated'])} />;
    case 'activated':
      return (
        <Activated
          draft={draft}
          onHandOver={() => {
            if (!draft.nickname) update({ nickname: draft.teenName.trim() });
            go('teenSetup');
          }}
          onDashboard={() => finish('#/guardian')}
        />
      );
    case 'teenSetup':
      return <TeenSetup draft={draft} update={update} onDone={() => finish('#/today')} />;
    default:
      return <Welcome go={go} onSkip={() => set({ onboarded: true })} />;
  }
}
