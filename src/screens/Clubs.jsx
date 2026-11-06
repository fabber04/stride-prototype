import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
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
      <header className="stack-6">
        <h1 className="h1">Find a club</h1>
        <p className="body-muted">Every club here is checked, and coaches confirm attendance.</p>
      </header>

      <label className="search">
        <Icon name="search" size={20} />
        <input
          type="search"
          placeholder="Search clubs near you"
          aria-label="Search clubs near you"
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

      <div className="stack-12">
        {visible.map((club) => (
          <a className="card list-row" key={club.id} href={`#/club/${club.id}`}>
            <Cover type={club.type} size="sm" label />
            <div className="stack-2 grow">
              <span className="row-title">{club.name}</span>
              <span className="row-meta">
                {club.short} · {club.range}
              </span>
              <span className="verified">
                <Icon name="check" size={14} strokeWidth={2.4} />
                {state.requested[club.id] ? 'Request sent to your guardian' : 'Verified club'}
              </span>
            </div>
            <Icon name="arrowRight" size={20} />
          </a>
        ))}
        {visible.length === 0 && <p className="body-muted empty">No clubs match that search yet.</p>}
      </div>
    </main>
  );
}
