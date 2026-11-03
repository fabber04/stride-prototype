import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { clubFilters, clubs } from '../data.js';

export default function Clubs() {
  const { state, set } = useStore();
  const filter = state.clubFilter;
  const visible = clubs.filter((club) => filter === 'All' || club.type === filter);

  const toggleRequest = (id) =>
    set((prev) => ({ requested: { ...prev.requested, [id]: !prev.requested[id] } }));

  return (
    <main className="page">
      <header className="stack-6">
        <h1 className="h1">Clubs near you</h1>
        <p className="body-muted">Every club is verified. Your guardian approves before you join.</p>
      </header>

      <div className="chips" role="group" aria-label="Filter clubs">
        {clubFilters.map((label) => (
          <button
            key={label}
            type="button"
            className={label === filter ? 'chip is-on' : 'chip'}
            aria-pressed={label === filter}
            onClick={() => set({ clubFilter: label })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stack-12">
        {visible.map((club) => {
          const sent = !!state.requested[club.id];
          return (
            <article className="card" key={club.id}>
              <div className="club-head">
                <div className="stack-4">
                  <h2 className="card-title">{club.name}</h2>
                  <span className="muted small">{club.when}</span>
                  <span className="muted small">{club.ages}</span>
                </div>
                <span className="tag">{club.type}</span>
              </div>
              <div className="verified">
                <Icon name="mentors" size={18} strokeWidth={2.2} />
                <span>Verified club. {club.note}</span>
              </div>
              {!sent ? (
                <button type="button" className="btn btn-primary" onClick={() => toggleRequest(club.id)}>
                  Ask my guardian to approve
                </button>
              ) : (
                <div className="stack-2">
                  <Status>Request sent. You can join once your guardian approves.</Status>
                  <button type="button" className="link-btn" onClick={() => toggleRequest(club.id)}>
                    Cancel request
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
