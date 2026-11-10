import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import WeekPlan from '../components/WeekPlan.jsx';
import { useStore } from '../store.jsx';
import { childColor, children, clubById, clubParents, clubs, guardianData } from '../data.js';

function initials(name) {
  return name
    .replace(/'s .*/, '')
    .slice(0, 2)
    .toUpperCase();
}

export default function Guardian() {
  const { state, set } = useStore();
  const kid = children.find((c) => c.id === state.child);
  const data = guardianData[state.child];
  // Requests come from Tino's taps on a club's "Ask my guardian to approve".
  const requests = state.child === 'tino' ? clubs.filter((club) => state.requested[club.id]) : [];
  const decide = (id, decision) => set((prev) => ({ decisions: { ...prev.decisions, [id]: decision } }));
  const toggleGroup = (id) => set((prev) => ({ parentGroups: { ...prev.parentGroups, [id]: !prev.parentGroups[id] } }));

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/clubs" aria-label="Find a club">
            <Icon name="search" size={20} strokeWidth={1.8} />
          </a>
          <button type="button" aria-label="Send weekly summary on WhatsApp" onClick={() => set({ summarySent: true })}>
            <Icon name="send" size={19} strokeWidth={1.8} />
          </button>
          <a href="#/guardian/controls" aria-label="Controls and permissions">
            <Icon name="sliders" size={19} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      {state.paused && (
        <a href="#/guardian/controls">
          <Status icon="lock">{state.account?.teen.name || kid.label}'s account is paused. Tap to change.</Status>
        </a>
      )}

      <header className="title-block">
        <h1 className="h1">Week plan</h1>
        <div className="subline">
          <span>
            <strong>Guardian view</strong> · {children.length} children
          </span>
          <span>This week</span>
        </div>
      </header>

      <WeekPlan requested={state.requested} decisions={state.decisions} />

      <div className="chips" role="group" aria-label="Choose a child">
        {children.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === state.child ? 'chip chip-dark is-on' : 'chip chip-dark'}
            aria-pressed={c.id === state.child}
            onClick={() => set({ child: c.id })}
          >
            <span className="kid-dot" style={{ background: childColor[c.id] }} aria-hidden="true" />
            {c.label}
          </button>
        ))}
      </div>

      <section className="hero" aria-label="Confirmed sessions">
        <span className="hero-eyebrow">Confirmed by coaches</span>
        <span className="hero-stat">
          <strong className="num">{data.confirmed}</strong> of {data.goal} sessions
        </span>
        <div className="segments" role="progressbar" aria-label="Confirmed sessions" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={data.confirmed}>
          {Array.from({ length: data.goal }, (_, i) => (
            <span key={i} className={i < data.confirmed ? 'is-done' : undefined} />
          ))}
        </div>
        <span className="hero-small">{data.message}</span>
      </section>

      {requests.length > 0 && (
        <>
          <SectionHead title="Waiting for you" />
          {requests.map((club) => {
            const decision = state.decisions[club.id];
            return (
              <section className="panel" key={club.id} aria-label={`${kid.label} wants to join ${club.name}`}>
                <div className="row-item">
                  <Cover type={club.type} size="sm" photo={club.id} />
                  <div className="stack-2 grow">
                    <span className="row-title">
                      {kid.label} wants to join {club.name}
                    </span>
                    <span className="row-meta">
                      {club.short} · {club.lead}
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

      <SectionHead title="Confirmed sessions" />
      <section className="panel panel-list" aria-label="Confirmed sessions">
        {data.sessions.map((session) => (
          <div className="club-line" key={session.name}>
            <span className="check-dot" aria-hidden="true">
              <Icon name="check" size={16} strokeWidth={2} />
            </span>
            <div className="stack-2">
              <span className="row-title">{session.name}</span>
              <span className="row-meta">{session.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <SectionHead title="Other parents at these clubs" />
      <section className="panel panel-list" aria-label="Other parents">
        {data.clubs.map((id) => {
          const club = clubById[id];
          const parents = clubParents[id];
          const joined = !!state.parentGroups[id];
          return (
            <div className="parents-line" key={id}>
              <span className="faces" aria-hidden="true">
                {parents.names.map((name) => (
                  <span key={name} className="face">
                    {initials(name)}
                  </span>
                ))}
                <span className="face face-more">+{parents.count - parents.names.length}</span>
              </span>
              <span className="stack-2 grow">
                <span className="row-title">{club.name}</span>
                <span className="row-meta">
                  {parents.names.join(', ')} and {parents.count - parents.names.length} other families
                </span>
              </span>
              <button
                type="button"
                className={joined ? 'chip is-on' : 'chip'}
                aria-pressed={joined}
                aria-label={joined ? `Leave the ${club.name} parents' WhatsApp group` : `Join the ${club.name} parents' WhatsApp group`}
                onClick={() => toggleGroup(id)}
              >
                {joined ? 'Joined' : 'Join group'}
              </button>
            </div>
          );
        })}
      </section>
      <p className="fine fine-left">Parents who know each other keep a closer eye out. Groups run on WhatsApp and the club leader is in each one.</p>

      {!state.summarySent ? (
        <button type="button" className="btn btn-ghost" onClick={() => set({ summarySent: true })}>
          <Icon name="send" size={18} strokeWidth={1.6} />
          Send weekly summary on WhatsApp
        </button>
      ) : (
        <div className="stack-2">
          <Status>Weekly summary sent on WhatsApp.</Status>
          <button type="button" className="link-btn" onClick={() => set({ summarySent: false })}>
            Send again
          </button>
        </div>
      )}
    </main>
  );
}
