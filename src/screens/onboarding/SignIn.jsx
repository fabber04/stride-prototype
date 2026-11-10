import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import FieldError from '../../components/FieldError.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { demoLogins } from '../../api/seed.js';

export default function SignIn({ back }) {
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
      <StepHeader onBack={back} title="Welcome back">
        Teens use their username and PIN. Guardians use their phone number or email and password.
      </StepHeader>

      <form className="stack-12" onSubmit={onSubmit}>
        <label className="stack-8">
          <span className="field-label">Username, phone or email</span>
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
          <span className="field-label">PIN or password</span>
          <input
            className="input"
            type="password"
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

      <section className="stack-8" aria-label="Demo accounts">
        <h2 className="section-title">Try a demo account</h2>
        <div className="panel panel-list">
          {demoLogins.map((d) => (
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
      </section>
    </main>
  );
}
