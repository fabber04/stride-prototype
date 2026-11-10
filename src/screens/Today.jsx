import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { useStore } from '../store.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { categories, clubById, clubFriends, mentor, myClubs } from '../data.js';

// Last eight weeks, oldest first: 1 = goal met. The current week follows them.
const history = [1, 1, 0, 1, 0, 1, 1, 1];

const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

export default function Today() {
  const { set } = useStore();

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/clubs" aria-label="Find a club">
            <Icon name="search" size={20} strokeWidth={1.8} />
          </a>
          <a href="#/mentor" className="has-dot" aria-label="1 new message from your mentor">
            <Icon name="bell" size={20} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      <header className="title-block">
        <h1 className="h1">Hi, Tino</h1>
        <div className="subline">
          <span>
            <strong>2 of 3 sessions</strong> this week
          </span>
          <span>{today}</span>
        </div>
        <div className="progress-line" role="progressbar" aria-label="Sessions this week" aria-valuemin={0} aria-valuemax={3} aria-valuenow={2}>
          <span style={{ width: '66.6%' }} />
        </div>
      </header>

      <section className="card" aria-label="Your clubs this week">
        {myClubs.map((id) => {
          const club = clubById[id];
          const friends = clubFriends[id] || [];
          return (
            <a className="list-row" key={id} href={`#/club/${id}`}>
              <Cover type={club.type} size="sm" photo={id} />
              <span className="stack-2 grow">
                <span className="row-title">{club.shortName || club.name}</span>
                <span className="row-meta">{club.short}</span>
                {friends.length > 0 && (
                  <span className="tag tag-keen tag-inline">With {friends.join(' & ')}</span>
                )}
              </span>
              <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
            </a>
          );
        })}
        <a className="list-row list-row-add" href="#/clubs">
          <span className="add-tile" aria-hidden="true">
            <Icon name="plus" size={18} strokeWidth={2} />
          </span>
          <span className="stack-2 grow">
            <span className="row-title">One more to hit your goal</span>
            <span className="row-meta">Find a club for Wednesday or Friday</span>
          </span>
        </a>
      </section>

      <section className="card streak" aria-label="Weekly streak">
        <span className="stack-2 grow">
          <span className="row-title">3-week streak</span>
          <span className="row-meta">Goal met in 6 of the last 8 weeks</span>
        </span>
        <span className="weeks" aria-hidden="true">
          {history.map((met, i) => (
            <span key={i} className={met ? 'week is-met' : 'week'} />
          ))}
          <span className="week is-current" />
        </span>
      </section>

      <a className="promo" href="#/swipe">
        <span className="promo-icon" aria-hidden="true">
          <HeartFill size={20} />
        </span>
        <span className="stack-2 grow">
          <span className="row-title">Swipe through clubs</span>
          <span className="promo-sub">Heart the ones you like. Your guardian decides.</span>
        </span>
        <Icon name="arrowRight" size={18} strokeWidth={2} />
      </a>

      <SectionHead title="From your mentor" />
      <section className="card card-pad" aria-label="Mentor challenge">
        <div className="row-center">
          <a href="#/mentor/profile" className="row-center" aria-label={`${mentor.name}'s profile`}>
            <MentorAvatar size="sm" />
            <span className="row-meta">{mentor.name} set you a challenge</span>
          </a>
        </div>
        <p className="panel-title">Build a quiz in 20 lines of Python</p>
        <p className="body-muted">Watch the 6 minute lesson, then show your quiz at Junior Coders. {mentor.first} confirms it and you earn the Builder badge.</p>
        <a className="btn btn-primary btn-sm" href="#/lesson/python">
          Start lesson
        </a>
      </section>

      <SectionHead title="Browse" />
      <div className="cat-grid">
        {categories.map((cat) => (
          <a key={cat.id} className="cat" href="#/clubs" onClick={() => set({ clubFilter: cat.id })}>
            <Cover type={cat.id} size="sm" />
            <span>{cat.id}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
