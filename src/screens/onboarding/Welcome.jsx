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
        <button type="button" className="btn btn-primary" onClick={() => go('age')}>
          I'm a teen
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => go('account')}>
          I'm a parent or guardian
        </button>
        <button type="button" className="link-btn" onClick={() => go('signIn')}>
          I already have an account
        </button>
        <p className="fine">Mentors and club leaders sign in with the account Stride gave them.</p>
      </div>
    </main>
  );
}
