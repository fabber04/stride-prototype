function StrideMark() {
  return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true">
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

function DotDivider({ tone = 'dark' }) {
  return (
    <div className={`splash-dots is-${tone}`} aria-hidden="true">
      <span className="splash-dots-line" />
      <span className="splash-dots-side" />
      <span className="splash-dots-center" />
      <span className="splash-dots-side" />
      <span className="splash-dots-line" />
    </div>
  );
}

function SplashFrame({ kicker, tagline, note, children }) {
  return (
    <main className="page onboard splash">
      <div className="splash-stage">
        <section className="splash-card">
          <div className="splash-glow" aria-hidden="true" />
          <div className="splash-card-rule" aria-hidden="true" />
          <div className="splash-card-copy">
            <div className="splash-logo">
              <span className="splash-logo-ring" aria-hidden="true" />
              <span className="splash-mark">
                <StrideMark />
              </span>
            </div>
            <p className="splash-script">Welcome to</p>
            <DotDivider />
            <h1 className="splash-title">Stride</h1>
          </div>
        </section>
      </div>
      <section className="splash-lower">
        <p className="splash-kicker">{kicker}</p>
        <DotDivider tone="light" />
        <p className="splash-tagline">{tagline}</p>
        {note ? <p className="splash-note">{note}</p> : null}
        <div className="splash-marklet" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="stack-12 onboard-actions splash-actions">{children}</div>
      </section>
    </main>
  );
}

export function AdminDoor({ go }) {
  return (
    <SplashFrame
      kicker="Club and mentor"
      tagline="Sign in on this side."
      note="Families use the main app."
    >
      <button type="button" className="btn btn-primary" onClick={() => go('club')}>
        I run a club
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => go('staff')}>
        I have a staff code
      </button>
      <a className="link-btn" href="#/">
        Back to the family app
      </a>
    </SplashFrame>
  );
}

export default function Welcome({ go, onSkip }) {
  return (
    <SplashFrame
      kicker="Clubs and mentors"
      tagline="Things to do, people who care."
      note="For 12 to 17 year olds. A guardian approves every step."
    >
      <button type="button" className="btn btn-primary" onClick={() => go('age')}>
        I'm a teen
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => go('account')}>
        I'm a parent or guardian
      </button>
      <button type="button" className="link-btn" onClick={() => go('join')}>
        I have a family code
      </button>
      <button type="button" className="link-btn" onClick={onSkip}>
        Skip and explore the demo
      </button>
    </SplashFrame>
  );
}
