import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import Toggle from '../components/Toggle.jsx';
import { useStore } from '../store.jsx';
import { consentEntry, consentItems, defaultConsent, formatWhen, verifyMethods } from '../onboarding.js';

function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GuardianControls() {
  const { state, set, reset } = useStore();
  const [deleting, setDeleting] = useState(false);
  const teen = state.account?.teen.name || 'Tino';
  const guardian = state.account?.guardian;
  const consent = state.consent || defaultConsent;
  const method = verifyMethods.find((m) => m.id === guardian?.verifiedBy);

  const setItem = (item, on) => {
    const next = { ...consent, [item.id]: on, ...(item.id === 'mentor' && !on ? { messages: false } : {}) };
    set((prev) => ({
      consent: next,
      consentLog: [
        ...prev.consentLog,
        consentEntry(guardian?.name || 'Guardian', next, `${on ? 'Turned on' : 'Turned off'}: ${item.title}`)
      ]
    }));
  };

  const download = () =>
    downloadJson(`stride-${teen.toLowerCase()}-data.json`, {
      exportedAt: new Date().toISOString(),
      account: state.account,
      consent,
      consentLog: state.consentLog,
      paused: state.paused,
      quietHours: state.quietHours
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
              Verified
            </span>
          )}
        </div>
      </header>

      <section className="panel panel-list" aria-label="Pause account">
        <Toggle
          title={`Pause ${teen}'s account`}
          detail="Stops club requests, lessons and mentor messages until you turn it back on."
          on={state.paused}
          onChange={(on) => set({ paused: on })}
        />
      </section>
      {state.paused && <Status icon="lock">Paused. {teen} sees a message that you paused the account.</Status>}

      <SectionHead title="What they can use" />
      <section className="panel panel-list" aria-label="Permissions">
        {consentItems
          .filter((item) => !item.needs || consent[item.needs])
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
          onChange={(on) => set({ quietHours: on })}
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
      {method && guardian?.verifiedAt && (
        <p className="fine fine-left">
          Identity checked by {method.title.toLowerCase()} on {formatWhen(guardian.verifiedAt)}.
        </p>
      )}

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
