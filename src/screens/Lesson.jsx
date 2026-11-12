import { Icon, PauseFill, PlayFill } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { clubById, mentor } from '../data.js';

const initials = (name) => name.split(' ').map((p) => p[0]).join('').toUpperCase();

export default function Lesson({ lesson }) {
  const { state, set, session, finishTask } = useStore();
  const saved = !!state.saved[lesson.id];
  const playing = !!state.playing[lesson.id];
  const done = !!state.taskDone[lesson.id];
  const ticked = state.steps[lesson.id] || {};
  const tickedCount = lesson.steps.filter((_, i) => ticked[i]).length;
  const ready = tickedCount === lesson.steps.length;
  const club = clubById[lesson.club];
  const toggle = (key) => set((prev) => ({ [key]: { ...prev[key], [lesson.id]: !prev[key][lesson.id] } }));
  const toggleStep = (i) =>
    set((prev) => {
      const current = prev.steps[lesson.id] || {};
      return { steps: { ...prev.steps, [lesson.id]: { ...current, [i]: !current[i] } } };
    });
  const elapsed = lesson.watched || Math.round(lesson.minutes * 0.4);

  return (
    <div className="detail">
      <main className="page">
        <NavBar title={lesson.type} back="#/learn" />

        <section className="video" aria-label="Lesson video">
          <img className="video-poster" src={`lessons/${lesson.id}.webp`} alt="" draggable="false" />
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
            <span className="num">{elapsed}:00</span>
            <div className="progress grow">
              <span style={{ width: `${(elapsed / lesson.minutes) * 100}%` }} />
            </div>
            <span className="num">{lesson.minutes}:00</span>
          </div>
        </section>

        <div className="stack-8">
          <span className="tag tag-blue">
            <Icon name="award" size={12} strokeWidth={2.2} />
            Earns the {lesson.badge} badge
          </span>
          <h2 className="h1 h1-detail">{lesson.title}</h2>
          <span className="row-meta">
            {lesson.minutes} min · {lesson.size} {saved ? 'on this phone' : 'to download'}
          </span>
        </div>

        <div className="confirmer">
          {lesson.by === mentor.short ? (
            <MentorAvatar size="md" />
          ) : (
            <span className="avatar avatar-md" aria-hidden="true">
              {initials(lesson.by)}
            </span>
          )}
          <span className="stack-2 grow">
            <span className="row-title">{lesson.by} confirms your task</span>
            <span className="row-meta">{club ? club.name : lesson.from}</span>
          </span>
          <Icon name="shield" size={20} strokeWidth={1.8} color="var(--accent)" />
        </div>

        <section className="panel" aria-label="Your offline task">
          <div className="panel-head">
            <h3 className="section-title">Your offline task</h3>
            <span className="row-meta num">
              {tickedCount} of {lesson.steps.length}
            </span>
          </div>
          <p className="body-muted">{lesson.task}</p>
          <ul className="steps">
            {lesson.steps.map((step, i) => (
              <li key={step}>
                <button
                  type="button"
                  className={ticked[i] ? 'step is-done' : 'step'}
                  aria-pressed={!!ticked[i]}
                  onClick={() => toggleStep(i)}
                  disabled={done}
                >
                  <span className="step-box" aria-hidden="true">
                    {ticked[i] && <Icon name="check" size={14} strokeWidth={3} />}
                  </span>
                  {step}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="detail-footer">
        {!done ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (session ? finishTask(lesson.id) : toggle('taskDone'))}
            disabled={!ready}
          >
            {ready ? `Send to ${lesson.by.split(' ')[0]} to confirm` : 'Tick off the steps to finish'}
          </button>
        ) : (
          <div className="stack-2">
            <Status>
              {lesson.by} has your task now. The {lesson.badge} badge goes on your record once they confirm it.
            </Status>
            {!session && (
              <button type="button" className="link-btn" onClick={() => toggle('taskDone')}>
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
