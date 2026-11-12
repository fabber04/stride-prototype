function StrideMark() {
  return (
    <svg viewBox="0 0 80 80" width="58" height="58" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M16 58V38" />
        <path d="M30 58V30" />
        <path d="M44 58V22" />
        <path d="M58 58V14" />
        <path d="M12 62L68 18" />
      </g>
    </svg>
  );
}

export default function Welcome({ go, onSkip }) {
  return (
    <main className="page onboard splash">
      <div className="splash-brand">
        <span className="splash-mark" aria-hidden="true">
          <StrideMark />
        </span>
        <p className="splash-word">Stride</p>
        <h1 className="display">
          Things to do,
          <br />
          <em>people who care.</em>
        </h1>
        <p className="splash-line">Clubs and mentors for 12 to 17 year olds. A guardian approves every step.</p>
      </div>

      <div className="stack-12 onboard-actions">
        <button type="button" className="btn btn-primary" onClick={() => go('age')}>
          I'm a teen
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => go('account')}>
          I'm a parent or guardian
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => go('club')}>
          I run a club
        </button>
        <button type="button" className="link-btn" onClick={() => go('join')}>
          I have a family code
        </button>
        <button type="button" className="link-btn" onClick={onSkip}>
          Skip and explore the demo
        </button>
      </div>
    </main>
  );
}
