import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { children, clubs, guardianData } from '../data.js';

export default function Guardian() {
  const { state, set } = useStore();
  const kid = children.find((c) => c.id === state.child);
  const data = guardianData[state.child];
  // Requests come from Tino's taps on a club's "Ask my guardian to approve".
  const requests = state.child === 'tino' ? clubs.filter((club) => state.requested[club.id]) : [];
  const decide = (id, decision) => set((prev) => ({ decisions: { ...prev.decisions, [id]: decision } }));

  return (
    <main className="page">
      <header className="stack-2">
        <span className="eyebrow">Guardian view</span>
        <h1 className="h1">Your children this week</h1>
      </header>

      <div className="chips" role="group" aria-label="Choose a child">
        {children.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === state.child ? 'chip chip-dark is-on' : 'chip chip-dark'}
            aria-pressed={c.id === state.child}
            onClick={() => set({ child: c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <section className="hero" aria-label="Confirmed sessions">
        <span className="hero-eyebrow">Confirmed by coaches</span>
        <span className="hero-stat">
          <strong className="num">
            {data.confirmed} of {data.goal}
          </strong>{' '}
          sessions
        </span>
        <div className="progress" role="progressbar" aria-label="Confirmed sessions" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={data.confirmed}>
          <span style={{ width: `${(data.confirmed / data.goal) * 100}%` }} />
        </div>
        <span className="hero-small">{data.message}</span>
      </section>

      {requests.length > 0 && (
        <>
          <h2 className="section-title">Waiting for you</h2>
          {requests.map((club) => {
            const decision = state.decisions[club.id];
            return (
              <section className="card" key={club.id} aria-label={`${kid.label} wants to join ${club.name}`}>
                <div className="row-item">
                  <Cover type={club.type} size="sm" label />
                  <div className="stack-2 grow">
                    <span className="row-title">
                      {kid.label} wants to join {club.name}
                    </span>
                    <span className="row-meta">
                      {club.short} · {club.note.replace(/\.$/, '')}
                    </span>
                  </div>
                </div>
                {!decision ? (
                  <div className="row-12">
                    <button type="button" className="btn btn-ghost grow" onClick={() => decide(club.id, 'declined')}>
                      Not now
                    </button>
                    <button type="button" className="btn btn-primary grow" onClick={() => decide(club.id, 'approved')}>
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="stack-2">
                    <Status>
                      {decision === 'approved'
                        ? `Approved. ${kid.label} can join ${club.name} from ${club.when.split(',')[0].replace(/s$/, '')}.`
                        : `Not now. ${kid.label} is told you said no for now.`}
                    </Status>
                    <button type="button" className="link-btn" onClick={() => decide(club.id, undefined)}>
                      Change my answer
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      <h2 className="section-title">Confirmed sessions</h2>
      <div className="stack-12">
        {data.sessions.map((session) => (
          <div className="session" key={session.name}>
            <span className="check-dot" aria-hidden="true">
              <Icon name="check" size={18} strokeWidth={2.4} />
            </span>
            <div className="stack-2">
              <span className="row-title">{session.name}</span>
              <span className="row-meta">{session.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {!state.summarySent ? (
        <button type="button" className="btn btn-ghost btn-push" onClick={() => set({ summarySent: true })}>
          <Icon name="send" size={20} />
          Send weekly summary on WhatsApp
        </button>
      ) : (
        <div className="stack-2 btn-push">
          <Status>Weekly summary sent on WhatsApp.</Status>
          <button type="button" className="link-btn" onClick={() => set({ summarySent: false })}>
            Send again
          </button>
        </div>
      )}
    </main>
  );
}
