import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import FieldError from '../../components/FieldError.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { demoLogins } from '../../api/seed.js';

const copy = {
  teen: {
    title: 'Hi there',
    intro: 'Sign in with the username and PIN your guardian set up for you.',
    loginLabel: 'Username',
    secretLabel: 'PIN',
    numeric: true,
    newHere: 'New to Stride? Get started',
    newStep: 'age'
  },
  guardian: {
    title: 'Welcome back',
    intro: 'Sign in with your phone number or email and your password.',
    loginLabel: 'Phone number or email',
    secretLabel: 'Password',
    newHere: 'New here? Set up your teen',
    newStep: 'account'
  },
  mentor: {
    title: 'Mentors and club leaders',
    intro: 'Sign in with the account Stride gave you after your checks.',
    loginLabel: 'Username',
    secretLabel: 'Password'
  }
};

export default function SignIn({ back, role = 'teen', go }) {
  const text = copy[role] || copy.teen;
  const demos = demoLogins.filter((d) => d.kind === role);
  const { api } = useBackend();
  const [login, setLogin] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (who = login, pass = secret) => {
    setBusy(true);
    setError(null);
    window.location.hash = '#/'; // each role lands on its own home
    const message = await attempt(api.signIn({ login: who, secret: pass }));
    setBusy(false);
    if (message) setError(message);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    signIn();
  };

  return (
    <main className="page onboard">
      <StepHeader onBack={back} title={text.title}>
        {text.intro}
      </StepHeader>

      <form className="stack-12" onSubmit={onSubmit}>
        <label className="stack-8">
          <span className="field-label">{text.loginLabel}</span>
          <input
            className="input"
            autoCapitalize="none"
            autoComplete="username"
            spellCheck="false"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </label>
        <label className="stack-8">
          <span className="field-label">{text.secretLabel}</span>
          <input
            className={text.numeric ? 'input pin-field' : 'input'}
            type="password"
            inputMode={text.numeric ? 'numeric' : undefined}
            autoComplete="current-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>
        <FieldError>{error}</FieldError>
        <button type="submit" className="btn btn-primary" disabled={!login.trim() || !secret || busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {text.newStep && (
        <button type="button" className="btn btn-ghost" onClick={() => go(text.newStep)}>
          {text.newHere}
        </button>
      )}
      {role === 'mentor' && (
        <p className="fine fine-left">
          Want to mentor? Every mentor passes an ID check, safeguarding training and reference checks first.{' '}
          <a className="see-all" href="mailto:mentors@stride.example?subject=Mentor%20application">
            Apply to mentor
          </a>
        </p>
      )}

      <details className="demo-box">
        <summary>Demo accounts</summary>
        <div className="panel panel-list">
          {demos.map((d) => (
            <button key={d.login} type="button" className="demo-login" onClick={() => signIn(d.login, d.secret)} disabled={busy}>
              <span className="stack-2 grow min-0">
                <span className="row-title">{d.label}</span>
                <span className="row-meta">
                  {d.role} · {d.login} / {d.secret}
                </span>
              </span>
              <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
            </button>
          ))}
        </div>
      </details>
    </main>
  );
}
