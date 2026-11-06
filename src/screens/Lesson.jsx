import { Icon, PauseFill, PlayFill } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';

export default function Lesson({ lesson }) {
  const { state, set } = useStore();
  const saved = !!state.saved[lesson.id];
  const playing = !!state.playing[lesson.id];
  const done = !!state.taskDone[lesson.id];
  const toggle = (key) => set((prev) => ({ [key]: { ...prev[key], [lesson.id]: !prev[key][lesson.id] } }));

  return (
    <div className="detail">
      <main className="page">
        <NavBar title="Lesson" back="#/learn" />

        <section className="video" aria-label="Lesson video">
          {saved ? (
            <span className="video-chip">
              <Icon name="check" size={14} strokeWidth={2.4} />
              Saved offline
            </span>
          ) : (
            <button type="button" className="video-chip" onClick={() => toggle('saved')}>
              <Icon name="download" size={14} strokeWidth={2.4} />
              Download {lesson.size}
            </button>
          )}
          <button
            type="button"
            className="video-play"
            aria-label={playing ? 'Pause lesson' : 'Play lesson'}
            onClick={() => toggle('playing')}
          >
            {playing ? <PauseFill size={26} /> : <PlayFill size={26} />}
          </button>
          <div className="video-bar">
            <span className="num">3:12</span>
            <div className="progress grow">
              <span style={{ width: '40%' }} />
            </div>
            <span className="num">{lesson.minutes}:00</span>
          </div>
        </section>

        <div className="stack-6">
          <span className="kicker">
            {lesson.type} · {lesson.from}
          </span>
          <h2 className="h1 h1-detail">{lesson.title}</h2>
          <span className="row-meta">
            {lesson.minutes} min · {lesson.size} {saved ? 'on this phone' : 'to download'}
          </span>
        </div>

        <section className="card" aria-label="Your offline task">
          <div className="row-center">
            <Icon name="clipboard" size={20} color="var(--primary)" />
            <h3 className="section-title">Your offline task</h3>
          </div>
          <p className="body-muted">{lesson.task}</p>
        </section>

        <section className="badge-card" aria-label={`${lesson.badge} badge`}>
          <span className="badge-icon">
            <Icon name="award" size={22} />
          </span>
          <div className="stack-2">
            <strong>{lesson.badge} badge</strong>
            <span>Earned when your {lesson.confirmer} confirms the task.</span>
          </div>
        </section>
      </main>

      <div className="detail-footer">
        {!done ? (
          <button type="button" className="btn btn-primary" onClick={() => toggle('taskDone')}>
            I did the task
          </button>
        ) : (
          <div className="stack-2">
            <Status>Sent to your {lesson.confirmer}. The badge is yours once they confirm it.</Status>
            <button type="button" className="link-btn" onClick={() => toggle('taskDone')}>
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
