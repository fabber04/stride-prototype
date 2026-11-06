import { Icon, PlayFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import { useStore } from '../store.jsx';
import { lessons } from '../data.js';

export default function Learn() {
  const { state } = useStore();
  const savedCount = lessons.filter((l) => state.saved[l.id]).length;

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="h1">Learn</h1>
        <span className="pill-success">
          <Icon name="download" size={16} strokeWidth={2.2} />
          {savedCount} saved offline
        </span>
      </header>

      <section className="hero" aria-label="Continue learning">
        <span className="hero-eyebrow">Continue learning</span>
        <div className="hero-row">
          <div className="stack-12 grow">
            <span className="hero-title">Three opening traps to know</span>
            <div className="row-center">
              <div className="progress grow" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={8} aria-valuenow={3}>
                <span style={{ width: '38%' }} />
              </div>
              <strong className="hero-small num">3/8 min</strong>
            </div>
          </div>
          <a className="hero-play" href="#/lesson/chess" aria-label="Continue Three opening traps to know">
            <PlayFill size={20} />
          </a>
        </div>
      </section>

      <h2 className="section-title">From your mentors and coaches</h2>
      <div className="stack-12">
        {lessons.map((lesson) => (
          <a className="card list-row" key={lesson.id} href={`#/lesson/${lesson.id}`}>
            <Cover type={lesson.type} size="sm" label />
            <div className="stack-4 grow">
              <span className="row-title">{lesson.title}</span>
              <span className="row-meta">
                {lesson.minutes} min · {lesson.by} · {lesson.size}
              </span>
            </div>
            <span className="play-dot" aria-hidden="true">
              <PlayFill size={14} />
            </span>
          </a>
        ))}
      </div>

      <div className="info">
        <Icon name="wifiOff" size={22} />
        <p>Saved lessons play with no data. Each one ends with a task you do offline, and your mentor confirms it.</p>
      </div>
    </main>
  );
}
