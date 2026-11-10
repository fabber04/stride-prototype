import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import Status from '../../components/Status.jsx';
import { MAX_AGE, MIN_AGE, ageBand, ageFrom } from '../../onboarding.js';

export function AgeCheck({ draft, update, go, back }) {
  const band = ageBand(ageFrom(draft.dob));
  const next = () => go(band === 'teen' ? 'invite' : band === 'young' ? 'young' : 'adult');

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={1} total={2} title="When's your birthday?">
        So we can show you clubs for your age.
      </StepHeader>

      <label className="stack-8">
        <span className="field-label">Date of birth</span>
        <input
          className="input"
          type="date"
          value={draft.dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => update({ dob: e.target.value })}
        />
      </label>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!band} onClick={next}>
          Continue
        </button>
      </div>
    </main>
  );
}

export function TooYoung({ back, restart }) {
  return (
    <main className="page onboard">
      <StepHeader onBack={back} title="Not just yet">
        Stride is for {MIN_AGE} to {MAX_AGE} year olds. Ask a parent or guardian to look again with you when you turn{' '}
        {MIN_AGE}.
      </StepHeader>
      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-ghost" onClick={restart}>
          Back to start
        </button>
      </div>
    </main>
  );
}

export function Adult({ back, go }) {
  return (
    <main className="page onboard">
      <StepHeader onBack={back} title="Stride is for teens">
        Teen accounts are for {MIN_AGE} to {MAX_AGE} year olds. You can still set up a teen in your family, or apply to
        mentor.
      </StepHeader>
      <section className="callout">
        <Icon name="shield" size={20} strokeWidth={1.6} />
        <p>Mentors pass an ID check, safeguarding training and reference checks before they meet any teen.</p>
      </section>
      <div className="detail-footer onboard-footer stack-12">
        <button type="button" className="btn btn-primary" onClick={() => go('account')}>
          Set up a teen as their guardian
        </button>
        <a className="btn btn-ghost" href="mailto:mentors@stride.example?subject=Mentor%20application">
          Apply to mentor
        </a>
      </div>
    </main>
  );
}

export function InviteGuardian({ draft, update, back, onSend }) {
  const ready = draft.teenName.trim() && draft.inviteContact.trim();

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={2} total={2} title="Who looks after you?">
        A parent or guardian sets up your account. We'll send them a link.
      </StepHeader>

      <label className="stack-8">
        <span className="field-label">Your first name</span>
        <input
          className="input"
          autoComplete="given-name"
          value={draft.teenName}
          onChange={(e) => update({ teenName: e.target.value })}
        />
      </label>

      <label className="stack-8">
        <span className="field-label">Their phone number or email</span>
        <input
          className="input"
          inputMode="email"
          placeholder="+263 77 123 4567"
          value={draft.inviteContact}
          onChange={(e) => update({ inviteContact: e.target.value })}
        />
      </label>

      <section className="callout">
        <Icon name="lock" size={20} strokeWidth={1.6} />
        <p>Until they say yes, you can look around but can't join clubs, meet a mentor or send messages.</p>
      </section>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={onSend}>
          Send the link
        </button>
      </div>
    </main>
  );
}

const locked = [
  { icon: 'clubs', label: 'Join clubs' },
  { icon: 'message', label: 'Meet your mentor' },
  { icon: 'award', label: 'Earn badges and keep a record' }
];

export function Waiting({ invite, onOpenInvite, onCancel }) {
  return (
    <main className="page onboard">
      <StepHeader title={`Nearly there, ${invite.teenName}`}>
        We sent a link to {invite.contact}. Your account opens as soon as they approve it.
      </StepHeader>

      <Status icon="send">Link sent. You can remind them yourself too.</Status>

      <section className="panel panel-list" aria-label="Unlocks after approval">
        {locked.map((item) => (
          <div className="club-line" key={item.label}>
            <span className="lock-dot" aria-hidden="true">
              <Icon name="lock" size={15} strokeWidth={2} />
            </span>
            <span className="row-title grow">{item.label}</span>
            <Icon name={item.icon} size={20} strokeWidth={1.6} color="var(--subtle)" />
          </div>
        ))}
      </section>

      <div className="detail-footer onboard-footer stack-12">
        <button type="button" className="btn btn-primary" onClick={onOpenInvite}>
          Open the guardian's link (demo)
        </button>
        <button type="button" className="link-btn" onClick={onCancel}>
          Wrong number? Start again
        </button>
      </div>
    </main>
  );
}
