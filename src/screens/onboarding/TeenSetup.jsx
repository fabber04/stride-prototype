import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import FieldError from '../../components/FieldError.jsx';
import { categories } from '../../data.js';

const goals = [1, 2, 3];

export default function TeenSetup({ draft, update, onDone, error, busy }) {
  const toggle = (id) =>
    update({
      interests: draft.interests.includes(id) ? draft.interests.filter((i) => i !== id) : [...draft.interests, id]
    });
  const ready = draft.interests.length > 0 && draft.nickname.trim();

  return (
    <main className="page onboard">
      <StepHeader kicker={`Hi ${draft.teenName}`} title="Make it yours">
        Your guardian set things up. Now pick what you're into.
      </StepHeader>

      <div className="stack-8" role="group" aria-label="What are you into?">
        <span className="field-label">What are you into?</span>
        <div className="cat-grid">
          {categories.map((c) => {
            const on = draft.interests.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={on ? 'cat cat-pick is-on' : 'cat cat-pick'}
                aria-pressed={on}
                onClick={() => toggle(c.id)}
              >
                <Icon name={c.icon} size={24} strokeWidth={1.8} />
                <span>{c.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stack-8" role="group" aria-label="Sessions a week">
        <span className="field-label">Sessions a week</span>
        <div className="row-8">
          {goals.map((g) => (
            <button
              key={g}
              type="button"
              className={draft.goal === g ? 'chip is-on grow' : 'chip grow'}
              aria-pressed={draft.goal === g}
              onClick={() => update({ goal: g })}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <label className="stack-8">
        <span className="field-label">Nickname</span>
        <input
          className="input"
          maxLength={20}
          value={draft.nickname}
          onChange={(e) => update({ nickname: e.target.value })}
        />
        <span className="small muted">Other teens only see this, never your full name.</span>
      </label>

      <FieldError>{error}</FieldError>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={onDone}>
          Let's go
        </button>
      </div>
    </main>
  );
}
