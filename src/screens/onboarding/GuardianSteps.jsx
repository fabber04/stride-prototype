import { useEffect, useState } from 'react';
import FieldError from '../../components/FieldError.jsx';
import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import Status from '../../components/Status.jsx';
import Toggle from '../../components/Toggle.jsx';
import { MAX_AGE, MIN_AGE, POLICY_VERSION, ageBand, ageFrom, consentItems, relations, verifyMethods } from '../../onboarding.js';

const TOTAL = 4;

export function GuardianAccount({ draft, update, go, back, invite }) {
  const ready = draft.guardianName.trim() && draft.guardianContact.trim() && draft.relation && draft.password.length >= 6;

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={1} total={TOTAL} kicker="Guardian account" title="About you">
        You'll approve clubs and mentors, and see every confirmed session.
      </StepHeader>

      {invite && (
        <Status icon="send">
          {invite.teenName} asked you to set up their Stride account.
        </Status>
      )}

      <label className="stack-8">
        <span className="field-label">Your full name</span>
        <input
          className="input"
          autoComplete="name"
          value={draft.guardianName}
          onChange={(e) => update({ guardianName: e.target.value })}
        />
      </label>

      <label className="stack-8">
        <span className="field-label">Phone number or email</span>
        <input
          className="input"
          inputMode="email"
          value={draft.guardianContact}
          onChange={(e) => update({ guardianContact: e.target.value })}
        />
      </label>

      <label className="stack-8">
        <span className="field-label">Create a password</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={draft.password}
          onChange={(e) => update({ password: e.target.value })}
        />
        <span className="small muted">6 or more characters. You'll sign in with your phone number or email and this.</span>
      </label>

      <div className="stack-8" role="group" aria-label="Your relationship to the teen">
        <span className="field-label">You are their</span>
        <div className="wrap-chips">
          {relations.map((r) => (
            <button
              key={r}
              type="button"
              className={draft.relation === r ? 'chip is-on' : 'chip'}
              aria-pressed={draft.relation === r}
              onClick={() => update({ relation: r })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => go('verify')}>
          Continue
        </button>
      </div>
    </main>
  );
}

export function VerifyGuardian({ draft, update, go, back }) {
  // idle -> checking -> done
  const [phase, setPhase] = useState(draft.verifiedAt ? 'done' : 'idle');

  useEffect(() => {
    if (phase !== 'checking') return undefined;
    const timer = setTimeout(() => {
      update({ verifiedAt: new Date().toISOString() });
      setPhase('done');
    }, 1800);
    return () => clearTimeout(timer);
  }, [phase, update]);

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={2} total={TOTAL} kicker="Guardian account" title="Check it's really you">
        Only an adult can approve a teen's account. We check once and don't keep photos of your ID.
      </StepHeader>

      <div className="stack-8" role="radiogroup" aria-label="How to verify">
        {verifyMethods.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={draft.method === m.id}
            className={draft.method === m.id ? 'option option-rich is-on' : 'option option-rich'}
            disabled={phase !== 'idle'}
            onClick={() => update({ method: m.id })}
          >
            <span className="row-title">{m.title}</span>
            <span className="row-meta">{m.detail}</span>
          </button>
        ))}
      </div>

      {phase === 'checking' && (
        <div className="status status-wait" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Checking…</span>
        </div>
      )}
      {phase === 'done' && <Status>Verified. Thanks, {draft.guardianName.split(' ')[0]}.</Status>}

      <p className="fine fine-left">Demo: no real check runs. In the live app a verification provider does this step.</p>

      <div className="detail-footer onboard-footer">
        {phase === 'done' ? (
          <button type="button" className="btn btn-primary" onClick={() => go('consent')}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!draft.method || phase === 'checking'}
            onClick={() => setPhase('checking')}
          >
            Verify me
          </button>
        )}
      </div>
    </main>
  );
}

export function ConsentStep({ draft, update, back, onAgree, step = 3, total = TOTAL }) {
  const name = draft.teenName.trim() || 'Your teen';
  const setItem = (id, on) =>
    update({ consent: { ...draft.consent, [id]: on, ...(id === 'mentor' && !on ? { messages: false } : {}) } });

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={step} total={total} kicker="Your permission" title={`What can ${name} use?`}>
        Each one is separate. You can change any of them later in Guardian, Controls.
      </StepHeader>

      <section className="panel panel-list" aria-label="Permissions">
        {consentItems
          .filter((item) => !item.needs || draft.consent[item.needs])
          .map((item) => (
            <Toggle
              key={item.id}
              title={item.title}
              detail={item.detail(name)}
              required={item.required}
              on={!!draft.consent[item.id]}
              onChange={(on) => setItem(item.id, on)}
            />
          ))}
      </section>

      <p className="fine fine-left">
        We save who agreed, when, and to which version of the terms (version {POLICY_VERSION}).
      </p>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" onClick={onAgree}>
          I agree to these
        </button>
      </div>
    </main>
  );
}

export const suggestLogin = (name) => name.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20);

export function ChildProfile({ draft, update, back, onActivate, step = 4, total = TOTAL, error, busy }) {
  const band = ageBand(ageFrom(draft.dob));
  const ready = draft.teenName.trim() && band === 'teen' && /^[a-z0-9_.]{3,20}$/.test(draft.login) && /^\d{4}$/.test(draft.pin);
  const setName = (teenName) => update(draft.loginEdited ? { teenName } : { teenName, login: suggestLogin(teenName) });

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={step} total={total} kicker="Teen profile" title="About your teen">
        Only you and their club leaders see their full name.
      </StepHeader>

      <label className="stack-8">
        <span className="field-label">First name</span>
        <input className="input" autoComplete="off" value={draft.teenName} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="stack-8">
        <span className="field-label">Date of birth</span>
        <input
          className="input"
          type="date"
          value={draft.dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => update({ dob: e.target.value })}
        />
        {draft.dob && band !== 'teen' && (
          <span className="small field-error">
            Stride teen accounts are for {MIN_AGE} to {MAX_AGE} year olds.
          </span>
        )}
      </label>

      <label className="stack-8">
        <span className="field-label">Username</span>
        <input
          className="input"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck="false"
          value={draft.login}
          onChange={(e) => update({ login: e.target.value.toLowerCase().replace(/\s/g, ''), loginEdited: true })}
        />
        <span className="small muted">3 to 20 letters, numbers, dots or underscores. They sign in with this.</span>
      </label>

      <label className="stack-8">
        <span className="field-label">4-digit PIN</span>
        <input
          className="input pin-field"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          pattern="[0-9]*"
          maxLength={4}
          value={draft.pin}
          onChange={(e) => update({ pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
        />
        <span className="small muted">Tell them the PIN. You can reset it any time in Controls.</span>
      </label>

      <section className="panel panel-list" aria-label="Limits">
        <Toggle
          title="Quiet hours"
          detail="No notifications from 9 pm to 7 am."
          on={draft.quietHours}
          onChange={(on) => update({ quietHours: on })}
        />
        <Toggle title="Club requests need my approval" detail="Always on for teen accounts." on required />
      </section>

      <FieldError>{error}</FieldError>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={onActivate}>
          {busy ? 'Opening…' : `Open ${draft.teenName.trim() || 'their'} account`}
        </button>
      </div>
    </main>
  );
}

export function Activated({ draft, onHandOver, onDashboard, error }) {
  const allowed = consentItems.filter((item) => draft.consent[item.id]);

  return (
    <main className="page onboard">
      <StepHeader title={`${draft.teenName}'s account is open`}>
        {draft.teenName} can now use everything you allowed. They sign in as <strong>{draft.login}</strong> with the PIN
        you chose.
      </StepHeader>

      <section className="panel" aria-label="What you allowed">
        <div className="panel-head">
          <h2 className="section-title">You allowed</h2>
          <Icon name="shield" size={18} strokeWidth={1.6} color="var(--accent)" />
        </div>
        <ul className="checks">
          {allowed.map((item) => (
            <li key={item.id}>
              <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
              {item.title}
            </li>
          ))}
        </ul>
      </section>

      <FieldError>{error}</FieldError>

      <div className="detail-footer onboard-footer stack-12">
        <button type="button" className="btn btn-primary" onClick={onHandOver}>
          Hand the phone to {draft.teenName}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDashboard}>
          Go to my dashboard
        </button>
      </div>
    </main>
  );
}
