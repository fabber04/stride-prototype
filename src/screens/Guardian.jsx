import { Icon } from '../icons.jsx';
import { useStore } from '../store.jsx';
import { children, guardianData } from '../data.js';

export default function Guardian() {
  const { state, set } = useStore();
  const data = guardianData[state.child];
  // The approval card follows the request Tino makes on the Clubs screen.
  const showApproval = state.child === 'tino' && !!state.requested.coders;
  const pending = state.decision === 'pending';

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="h1 h1-guardian">Guardian view</h1>
        <a className="pill-link" href="#/today">Kid view</a>
      </header>

      <div className="chips" role="group" aria-label="Choose a child">
        {children.map((kid) => (
          <button
            key={kid.id}
            type="button"
            className={kid.id === state.child ? 'chip chip-wide is-on' : 'chip chip-wide'}
            aria-pressed={kid.id === state.child}
            onClick={() => set({ child: kid.id })}
          >
            {kid.label}
          </button>
        ))}
      </div>

      {showApproval && (
        <section className="card card-accent" aria-label="Needs your approval">
          <span className="label">Needs your approval</span>
          <h2 className="card-title">Tino asked to join Junior Coders</h2>
          <p className="body-muted">Wednesdays, 4:30 pm. Mentor Tendai N. has passed ID and safeguarding checks.</p>
          {pending ? (
            <div className="row-8">
              <button type="button" className="btn btn-primary grow" onClick={() => set({ decision: 'approved' })}>
                Approve
              </button>
              <button type="button" className="btn btn-outline grow" onClick={() => set({ decision: 'declined' })}>
                Decline
              </button>
            </div>
          ) : (
            <div className="stack-2">
              <div className="status" role="status">
                {state.decision === 'approved'
                  ? 'Approved. Tino can join Junior Coders from this Wednesday.'
                  : 'Declined. Tino is told that you said no.'}
              </div>
              <button type="button" className="link-btn" onClick={() => set({ decision: 'pending' })}>
                Change my answer
              </button>
            </div>
          )}
        </section>
      )}

      <section className="card" aria-label="This week">
        <div className="week-head">
          <h2 className="card-title card-title-sm">This week</h2>
          <span className="week-count num">{data.confirmed}</span>
        </div>
        {data.sessions.map((session) => (
          <div className="session-row" key={session.name}>
            <Icon name="checkCircle" strokeWidth={2.4} color="var(--success)" style={{ flex: 'none', marginTop: 1 }} />
            <div className="stack-2">
              <span className="session-name">{session.name}</span>
              <span className="muted tiny">{session.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="callout" aria-label="Messages">
        <Icon name="message" color="var(--blue)" />
        <p>{data.message} You can read every message in Stride.</p>
      </section>

      <section className="card card-row" aria-label="WhatsApp summary">
        <div className="stack-4">
          <span id="digest-label" className="switch-title">Sunday summary on WhatsApp</span>
          <span className="muted tiny">
            Sessions attended, new badges and mentor messages. No app or data needed to read it.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={state.digest}
          aria-labelledby="digest-label"
          className={state.digest ? 'switch is-on' : 'switch'}
          onClick={() => set({ digest: !state.digest })}
        >
          <span className="switch-knob" />
        </button>
      </section>
    </main>
  );
}
