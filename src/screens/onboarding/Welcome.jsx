import { Icon } from '../../icons.jsx';

export default function Welcome({ go }) {
  return (
    <main className="page onboard">
      <div className="onboard-hero">
        <span className="onboard-mark" aria-hidden="true">
          <Icon name="sparkles" size={30} strokeWidth={1.8} />
        </span>
        <h1 className="display">
          Things to do,
          <br />
          <em>people who care.</em>
        </h1>
        <p className="body-muted">
          Verified clubs, checked mentors and short lessons for 12 to 17 year olds. A parent or guardian approves
          everything.
        </p>
      </div>

      <div className="stack-12 onboard-actions">
        <button type="button" className="btn btn-primary" onClick={() => go('signIn:teen')}>
          I'm a teen
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => go('signIn:guardian')}>
          I'm a parent or guardian
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => go('signIn:mentor')}>
          I'm a mentor
        </button>
      </div>
    </main>
  );
}
