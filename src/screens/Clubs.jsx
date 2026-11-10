import { Icon, HeartFill } from '../icons.jsx';
import ClubCard from '../components/ClubCard.jsx';
import { useStore } from '../store.jsx';
import { clubFilters, clubs } from '../data.js';

export default function Clubs() {
  const { state, set } = useStore();
  const filter = state.clubFilter;
  const query = state.clubSearch.trim().toLowerCase();
  const visible = clubs.filter(
    (club) => (filter === 'All' || club.type === filter) && (!query || club.name.toLowerCase().includes(query))
  );

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/swipe" className="is-coral" aria-label="Swipe through clubs">
            <HeartFill size={18} />
          </a>
          <a href="#/guardian" aria-label="Guardian view">
            <Icon name="shield" size={20} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      <header className="title-block">
        <h1 className="h1">Discover</h1>
        <div className="subline">
          <span>
            <strong>{clubs.length} checked clubs</strong> near you
          </span>
          <span>This term</span>
        </div>
      </header>

      <label className="search">
        <Icon name="search" size={18} strokeWidth={1.8} />
        <input
          type="search"
          placeholder="Search clubs"
          aria-label="Search clubs"
          value={state.clubSearch}
          onChange={(e) => set({ clubSearch: e.target.value })}
        />
      </label>

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

      <a className="promo" href="#/swipe">
        <span className="promo-icon" aria-hidden="true">
          <HeartFill size={20} />
        </span>
        <span className="stack-2 grow">
          <span className="row-title">Not sure what to try?</span>
          <span className="promo-sub">Swipe through clubs. Your guardian decides.</span>
        </span>
        <Icon name="arrowRight" size={18} strokeWidth={2} />
      </a>

      {visible.length > 0 ? (
        <div className="feed">
          {visible.map((club) => (
            <ClubCard key={club.id} club={club} requested={!!state.requested[club.id]} />
          ))}
        </div>
      ) : (
        <p className="body-muted empty">No clubs match that search yet.</p>
      )}
    </main>
  );
}
