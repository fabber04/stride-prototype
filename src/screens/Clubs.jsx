import { Icon, HeartFill } from '../icons.jsx';
import ClubCard from '../components/ClubCard.jsx';
import { useStore } from '../store.jsx';
import { useBackend } from '../api/index.jsx';
import { clubFilters } from '../data.js';
import { clubList, clubStatus, membersOf, teensOf } from '../api/selectors.js';

export default function Clubs() {
  const { state, set } = useStore();
  const { db, user } = useBackend();
  const isTeen = user.role === 'teen';
  const filter = state.clubFilter;
  const query = state.clubSearch.trim().toLowerCase();
  const interests = isTeen ? user.interests : [];
  const all = clubList(db);
  const visible = all
    .filter((club) => (filter === 'All' || club.type === filter) && (!query || club.name.toLowerCase().includes(query)))
    .sort((a, b) => Number(interests.includes(b.type)) - Number(interests.includes(a.type)));
  const family = user.role === 'guardian' ? new Set(teensOf(db, user.id).map((t) => t.id)) : null;

  return (
    <main className="page">
      {isTeen && (
        <div className="toolbar-row">
          <div className="toolbar">
            <a href="#/swipe" className="is-coral" aria-label="Swipe through clubs">
              <HeartFill size={18} />
            </a>
          </div>
        </div>
      )}

      <header className="title-block">
        <h1 className="h1">{isTeen ? 'Discover' : 'Clubs'}</h1>
        <div className="subline">
          <span>
            <strong>{all.length} checked clubs</strong> near you
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

      {isTeen && (
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
      )}

      {visible.length > 0 ? (
        <div className="feed">
          {visible.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              status={isTeen ? clubStatus(db, user.id, club.id) : null}
              goers={family ? membersOf(db, club.id).filter((t) => family.has(t.id)).map((t) => t.name) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="body-muted empty">No clubs match that search yet.</p>
      )}
    </main>
  );
}
