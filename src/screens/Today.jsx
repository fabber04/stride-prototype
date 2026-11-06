import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { useStore } from '../store.jsx';
import { categories, clubById, myClubs } from '../data.js';

export default function Today() {
  const { state, set } = useStore();

  return (
    <main className="page">
      <header className="topbar">
        <div className="stack-2">
          <span className="eyebrow">Welcome back</span>
          <h1 className="greeting">Tino</h1>
        </div>
        <div className="row-4">
          <a className="icon-btn" href="#/clubs" aria-label="Find a club">
            <Icon name="search" />
          </a>
          <a className="icon-btn" href="#/mentor" aria-label="1 new message from your mentor">
            <Icon name="bell" />
            <span className="dot" aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="hero" aria-label="Weekly streak">
        <div className="hero-head">
          <span className="hero-title">Weekly streak</span>
          <span className="hero-pill">3 weeks running</span>
        </div>
        <div className="hero-row">
          <div className="stack-8 grow">
            <div className="hero-progress-label">
              <span>Sessions this week</span>
              <strong className="num">2/3</strong>
            </div>
            <div className="progress" role="progressbar" aria-label="Sessions this week" aria-valuemin={0} aria-valuemax={3} aria-valuenow={2}>
              <span style={{ width: '66%' }} />
            </div>
          </div>
          <a className="hero-btn" href="#/clubs" aria-label="Find your next session">
            <Icon name="arrowRight" size={20} strokeWidth={2.2} />
          </a>
        </div>
      </section>

      <div className="cats" role="group" aria-label="Browse clubs by category">
        {categories.slice(0, 4).map((cat) => {
          const on = state.clubFilter === cat.id;
          return (
            <a key={cat.id} className={on ? 'cat is-on' : 'cat'} href="#/clubs" onClick={() => set({ clubFilter: cat.id })}>
              <Icon name={cat.icon} size={22} strokeWidth={1.8} />
              {cat.id}
            </a>
          );
        })}
      </div>

      <SectionHead title="Your clubs this week" href="#/clubs" />
      <div className="grid-2">
        {myClubs.map((id) => {
          const club = clubById[id];
          return (
            <a className="tile" key={id} href={`#/club/${id}`}>
              <Cover type={club.type} />
              <span className="tile-title">{club.shortName || club.name}</span>
              <span className="tile-meta">{club.short}</span>
            </a>
          );
        })}
      </div>

      <SectionHead title="Mentor challenge" />
      <a className="card list-row" href="#/lesson/python">
        <Cover type="Tech" size="sm" />
        <div className="stack-2 grow">
          <span className="row-title">Build a quiz in 20 lines</span>
          <span className="row-meta">From Tendai N. · Earns the Builder badge</span>
        </div>
        <Icon name="arrowRight" size={20} />
      </a>
    </main>
  );
}
