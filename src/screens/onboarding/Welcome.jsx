import Wordmark from '../../components/Wordmark.jsx';

export default function Welcome({ go }) {
  return (
    <main className="page onboard">
      <div className="onboard-hero">
        <Wordmark size="lg" />
        <h1 className="display">
          Things to do,
          <br />
          <em>people who care.</em>
        </h1>
        <p className="body-muted">
          Verified clubs, vetted mentors and short lessons for 12 to 17 year olds, with a parent or guardian
          approving every step.
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
