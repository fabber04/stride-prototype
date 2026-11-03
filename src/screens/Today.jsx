import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';

function Tally() {
  return (
    <svg
      width="76"
      height="56"
      viewBox="0 0 64 48"
      fill="none"
      stroke="#93c5fd"
      strokeWidth="5"
      strokeLinecap="round"
      role="img"
      aria-label="Five tally marks, one for each week"
    >
      <path d="M10 6v36M22 6v36M34 6v36M46 6v36" />
      <path d="M3 35L56 13" />
    </svg>
  );
}

export default function Today() {
  const { state, set } = useStore();
  const checked = state.checkedIn;

  return (
    <main className="page">
      <div className="topbar">
        <span className="brand" aria-label="Stride"><span className="brand-initial" aria-hidden="true">S</span><span aria-hidden="true">tride</span></span>
        <a className="pill-link" href="#/guardian" aria-label="Switch to guardian view">
          <Icon name="lock" size={18} />
          Guardian
        </a>
      </div>

      <h1 className="h1">Your week, Tino</h1>

      <section className="streak" aria-label="Streak">
        <div className="streak-head">
          <div className="streak-count">
            <span className="streak-number">5 weeks</span>
            <span className="streak-sub">in a row</span>
          </div>
          <Tally />
        </div>
        <div className="goal">
          <div className="goal-row">
            <span>This week's goal</span>
            <span className="num">2 of 3 sessions</span>
          </div>
          <div className="goal-bars" aria-hidden="true">
            <span className="goal-bar is-done" />
            <span className="goal-bar is-done" />
            <span className="goal-bar" />
          </div>
        </div>
        <p className="streak-note">1 streak freeze left. If you miss a week, it covers you.</p>
      </section>

      <section className="card" aria-label="Next session">
        <div className="stack-4">
          <span className="label">Next up, today</span>
          <span className="card-title card-title-lg">Football Academy</span>
          <span className="muted small">3:00 pm, Verified club</span>
        </div>
        {!checked ? (
          <button type="button" className="btn btn-primary" onClick={() => set({ checkedIn: true })}>
            Check in
          </button>
        ) : (
          <div className="stack-4">
            <Status>Checked in. Your coach confirms it at the session, then it counts toward your goal.</Status>
            <button type="button" className="link-btn" onClick={() => set({ checkedIn: false })}>
              Undo check in
            </button>
          </div>
        )}
      </section>

      <section className="card" aria-label="Mentor challenge">
        <div className="mentor-line">
          <span className="avatar avatar-sm" aria-hidden="true">TN</span>
          <div className="stack-0">
            <span className="label">Challenge from your mentor</span>
            <a className="mentor-name" href="#/mentor">Tendai N.</a>
          </div>
        </div>
        <p className="card-title">Build a quiz in 20 lines of Python</p>
        <p className="body-muted">
          Watch the 6 minute lesson, write your quiz, then show it at Junior Coders on Wednesday. You earn the
          Builder badge when your mentor confirms it.
        </p>
        <a className="btn btn-outline" href="#/learn">Open lesson</a>
      </section>

      <div className="note">
        <Icon name="download" size={20} color="var(--blue)" />
        <span>3 lessons saved on this phone. They play without data and your progress syncs when you reconnect.</span>
      </div>
    </main>
  );
}
