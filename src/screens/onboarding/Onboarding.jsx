import { useCallback, useState } from 'react';
import { useStore } from '../../store.jsx';
import { explain } from '../../api.js';
import { consentEntry, defaultConsent } from '../../onboarding.js';
import Welcome from './Welcome.jsx';
import TeenSetup from './TeenSetup.jsx';
import { Adult, AgeCheck, InviteGuardian, JoinFamily, TooYoung, Waiting } from './TeenSteps.jsx';
import { Activated, ChildProfile, ConsentStep, GuardianAccount, VerifyGuardian } from './GuardianSteps.jsx';
import ClubPick from './ClubPick.jsx';

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
  const { state, set, session, startFamily, joinFamily, saveSetup, exploreDemo, leaveFamily } = useStore();
  const invite = state.pendingInvite;
  const [draft, setDraft] = useState(() =>
    invite ? { ...emptyDraft, teenName: invite.teenName, dob: invite.dob, nickname: invite.teenName } : emptyDraft
  );
  const [history, setHistory] = useState([invite ? 'waiting' : 'welcome']);
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);
  const step = history[history.length - 1];

  const update = useCallback((patch) => setDraft((prev) => ({ ...prev, ...patch })), []);
  const go = (next) => {
    setHistory((prev) => [...prev, next]);
    window.scrollTo(0, 0);
  };
  const back = () => setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const restart = () => {
    leaveFamily();
    setDraft(emptyDraft);
    setHistory(['welcome']);
  };

  const finish = async (route) => {
    setProblem('');
    const patch = {
      onboarded: true,
      pendingInvite: null,
      quietHours: draft.quietHours,
      child: 'teen',
      requested: {},
      decisions: {},
      skipped: {},
      messages: [],
      reports: [],
      taskDone: {},
      recordShared: false,
      summarySent: false,
      parentGroups: {},
      account: {
        guardian: {
          name: draft.guardianName.trim(),
          contact: draft.guardianContact.trim(),
          relation: draft.relation,
          verifiedBy: draft.method,
          verifiedAt: null
        },
        teen: {
          name: draft.teenName.trim(),
          dob: draft.dob,
          nickname: draft.nickname.trim() || draft.teenName.trim(),
          interests: draft.interests,
          goal: draft.goal
        }
      },
      consent: state.consent ?? draft.consent,
      consentLog: state.consentLog
    };
    try {
      await saveSetup(patch);
      window.location.hash = route;
    } catch (error) {
      setProblem(explain(error));
    }
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
          busy={sending}
          error={problem}
          onSend={async () => {
            setProblem('');
            setSending(true);
            try {
              await startFamily('teen', {
                pendingInvite: {
                  teenName: draft.teenName.trim(),
                  dob: draft.dob,
                  contact: draft.inviteContact.trim(),
                  sentAt: new Date().toISOString()
                },
                quietHours: draft.quietHours
              });
              update({ nickname: draft.teenName.trim() });
              setHistory(['waiting']);
            } catch (error) {
              setProblem(explain(error));
            } finally {
              setSending(false);
            }
          }}
        />
      );
    case 'join':
      return (
        <JoinFamily
          back={back}
          onJoin={async (code) => {
            const joined = await joinFamily(code);
            if (joined.scope === 'org') return;
            if (joined.role === 'leader') {
              window.location.hash = '#/today';
              return;
            }
            if (joined.role === 'guardian' && !joined.state.onboarded) {
              const nextInvite = joined.state.pendingInvite;
              if (nextInvite) {
                setDraft((prev) => ({
                  ...prev,
                  teenName: nextInvite.teenName,
                  dob: nextInvite.dob,
                  nickname: nextInvite.teenName
                }));
              }
              setHistory(['account']);
              return;
            }
            window.location.hash = joined.role === 'guardian' ? '#/guardian' : '#/today';
          }}
        />
      );
    case 'waiting':
      return (
        <Waiting
          invite={invite}
          code={session?.invites?.guardian?.code}
          expiresAt={session?.invites?.guardian?.expiresAt}
          onCancel={restart}
        />
      );
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
        <Activated draft={draft} problem={problem} onDashboard={() => finish('#/guardian')} />
      );
    case 'club':
      return <ClubPick back={back} />;
    case 'teenSetup':
      return <TeenSetup draft={draft} update={update} problem={problem} onDone={() => finish('#/today')} />;
    default:
      return <Welcome go={go} onSkip={exploreDemo} />;
  }
}
