import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import Toggle from '../components/Toggle.jsx';
import { useStore } from '../store.jsx';
import { explain } from '../api.js';
import { ageFrom, consentEntry, consentItems, defaultConsent, formatWhen, verifyMethods } from '../onboarding.js';

function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GuardianControls() {
  const { state, set, reset, session, updateSettings } = useStore();
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  const teen = state.account?.teen.name || 'Tino';
  const guardian = state.account?.guardian;
  const consent = state.consent || defaultConsent;
  const method = verifyMethods.find((m) => m.id === guardian?.verifiedBy);
  const age = ageFrom(state.account?.teen?.dob);

  const save = async (patch, local) => {
    if (!session) {
      set(local || patch);
      return;
    }
    try {
      await updateSettings(patch);
    } catch (error) {
      setNotice(explain(error));
    }
  };

  const setItem = (item, on) => {
    const next = { ...consent, [item.id]: on, ...(item.id === 'mentor' && !on ? { messages: false } : {}) };
    const note = consentEntry(guardian?.name || 'Guardian', next, `${on ? 'Turned on' : 'Turned off'}: ${item.title}`);
    if (!session) {
      set((prev) => ({ consent: next, consentLog: [...prev.consentLog, note] }));
      return;
    }
    save({ consent: next, consentNote: note });
  };

  const download = () =>
    downloadJson(`stride-${teen.toLowerCase()}-data.json`, {
      exportedAt: new Date().toISOString(),
      account: state.account,
      consent,
      consentLog: state.consentLog,
      paused: state.paused,
      quietHours: state.quietHours,
      requested: state.requested,
      decisions: state.decisions,
      messages: state.messages,
      reports: state.reports,
      taskDone: state.taskDone,
      recordShared: state.recordShared,
      summarySent: state.summarySent,
      parentGroups: state.parentGroups
    });

  const deleteAccount = () => {
    reset();
    window.location.hash = '#/';
  };

  return (
    <main className="page">
      <NavBar title="Controls" back="#/guardian" />

      <header className="title-block">
        <h1 className="h1">{teen}'s account</h1>
        <div className="subline">
          {guardian ? (
            <span>
              <strong>{guardian.name}</strong> · {guardian.relation}
            </span>
          ) : (
            <span>Demo account</span>
          )}
          {guardian?.verifiedAt && (
            <span className="tag tag-blue">
              <Icon name="shield" size={12} strokeWidth={2.4} />
              Identity checked
            </span>
          )}
        </div>
      </header>

      <section className="panel panel-list" aria-label="Pause account">
        <Toggle
          title={`Pause ${teen}'s account`}
          detail="Stops club requests, lessons and mentor messages until you turn it back on."
          on={state.paused}
          onChange={(on) => save({ paused: on }, { paused: on })}
        />
      </section>
      {state.paused && <Status icon="lock">Paused. {teen} sees a message that you paused the account.</Status>}

      <SectionHead title="What they can use" />
      <section className="panel panel-list" aria-label="Permissions">
        {notice && <Status icon="lock">{notice}</Status>}
        {consentItems
          .filter((item) => (!item.needs || consent[item.needs]) && (!item.under13 || (age !== null && age < 13)))
          .map((item) => (
            <Toggle
              key={item.id}
              title={item.title}
              detail={item.detail(teen)}
              required={item.required}
              on={!!consent[item.id]}
              onChange={(on) => setItem(item, on)}
            />
          ))}
      </section>
      <p className="fine fine-left">{teen} can see this list too, so nothing is hidden from them.</p>

      <SectionHead title="Limits" />
      <section className="panel panel-list" aria-label="Limits">
        <Toggle
          title="Quiet hours"
          detail="No notifications from 9 pm to 7 am."
          on={state.quietHours}
          onChange={(on) => save({ quietHours: on }, { quietHours: on })}
        />
        <Toggle title="Club requests need my approval" detail="Always on for teen accounts." on required />
      </section>

      <SectionHead title="Consent history" />
      <section className="panel panel-list" aria-label="Consent history">
        {state.consentLog.length === 0 ? (
          <p className="row-meta empty">No changes recorded yet.</p>
        ) : (
          [...state.consentLog].reverse().map((entry) => (
            <div className="club-line" key={entry.at + entry.note}>
              <span className="check-dot" aria-hidden="true">
                <Icon name="check" size={16} strokeWidth={2} />
              </span>
              <div className="stack-2">
                <span className="row-title">{entry.note}</span>
                <span className="row-meta">
                  {entry.by} · {formatWhen(entry.at)} · terms {entry.version}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
      {method && (
        <p className="fine fine-left">
          {guardian?.verifiedAt
            ? `Identity checked by ${method.title.toLowerCase()} on ${formatWhen(guardian.verifiedAt)}.`
            : `Identity is not checked yet. You chose ${method.title.toLowerCase()} for when a real check is connected.`}
        </p>
      )}

      <SectionHead title="Privacy" />
      <section className="panel card-pad" aria-label="Privacy">
        <p className="body">
          {session
            ? `${teen}'s account, consent, club requests, messages and reports are stored in the Stride database. Each phone joins with its own code, and that code works once.`
            : `This device keeps ${teen}'s account, your consent choices, club requests, mentor messages and reports.`}{' '}
          You can read every message. A message that asks to leave Stride, share a number, keep a secret, or meet
          outside a club is held until you allow it.
        </p>
        <p className="body">
          Identity is not checked in this build. A launch still needs a real identity provider, a server,
          and each mentor's permission before their name and photo are used.
        </p>
      </section>

      <SectionHead title="Data" />
      <button type="button" className="btn btn-ghost" onClick={download}>
        <Icon name="download" size={18} strokeWidth={1.8} />
        Download {teen}'s data
      </button>
      <button type="button" className="btn btn-danger-outline" onClick={() => setDeleting(true)}>
        Delete {teen}'s account
      </button>

      {deleting && (
        <div className="backdrop">
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Delete account">
            <div className="stack-12">
              <h2 className="card-title card-title-lg">Delete {teen}'s account?</h2>
              <p className="body-muted">
                This removes {teen}'s profile, record and badges, and your consent history. It can't be undone.
              </p>
              <div className="row-8">
                <button type="button" className="btn btn-danger grow" onClick={deleteAccount}>
                  Delete
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setDeleting(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
