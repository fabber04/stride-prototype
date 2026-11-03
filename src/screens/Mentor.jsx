import { useState } from 'react';
import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import { reportReasons } from '../data.js';

const checks = ['ID verified', 'Safeguarding training complete', 'Approved by the Junior Coders club'];

export default function Mentor() {
  // idle -> composing -> sent
  const [message, setMessage] = useState('idle');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState('');

  const openReport = () => {
    setReporting(true);
    setReported(false);
    setReason('');
  };
  const closeReport = () => {
    setReporting(false);
    setReported(false);
    setReason('');
  };

  return (
    <main className="page">
      <header className="profile">
        <span className="avatar avatar-lg" aria-hidden="true">TN</span>
        <div className="stack-2">
          <h1 className="h1 h1-profile">Tendai N.</h1>
          <span className="muted small">Computer science student</span>
          <span className="muted small">Mentor at Junior Coders</span>
        </div>
      </header>

      <section className="card" aria-label="Safety checks">
        <h2 className="card-title card-title-sm">Checked before joining Stride</h2>
        {checks.map((item) => (
          <div className="check-row" key={item}>
            <Icon name="checkCircle" strokeWidth={2.4} color="var(--success)" />
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="callout" aria-label="How messages work">
        <Icon name="eye" color="var(--blue)" />
        <p>Messages stay inside Stride. Your guardian can read every one.</p>
      </section>

      {message === 'idle' && (
        <button type="button" className="btn btn-primary" onClick={() => setMessage('composing')}>
          Ask a question
        </button>
      )}

      {message === 'composing' && (
        <section className="card" aria-label="New message">
          <label htmlFor="question" className="field-label">Your question for Tendai</label>
          <textarea
            id="question"
            className="textarea"
            rows="3"
            placeholder="For example: can I use my own laptop on Wednesday?"
          />
          <p className="small muted">Your guardian will see this message.</p>
          <div className="row-8">
            <button type="button" className="btn btn-primary grow" onClick={() => setMessage('sent')}>
              Send
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMessage('idle')}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {message === 'sent' && (
        <div className="stack-4">
          <Status>Sent to Tendai. Your guardian can see it too.</Status>
          <button type="button" className="link-btn" onClick={() => setMessage('composing')}>
            Ask another question
          </button>
        </div>
      )}

      <section className="card" aria-label="Challenges">
        <span className="label">Current challenge</span>
        <span className="card-title card-title-sm">Build a quiz in 20 lines of Python</span>
        <a className="text-link" href="#/learn">Open the lesson</a>
      </section>

      <button type="button" className="btn btn-danger-outline" onClick={openReport}>
        <Icon name="flag" size={18} />
        Report a concern
      </button>

      {reporting && (
        <div className="backdrop">
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Report a concern">
            {!reported ? (
              <div className="stack-12">
                <h2 className="card-title card-title-lg">What happened?</h2>
                <p className="body-muted">
                  Your report goes to the Stride safeguarding lead. The mentor does not see who sent it.
                </p>
                {reportReasons.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={label === reason ? 'option is-on' : 'option'}
                    aria-pressed={label === reason}
                    onClick={() => setReason(label)}
                  >
                    {label}
                  </button>
                ))}
                <div className="row-8">
                  <button type="button" className="btn btn-danger grow" onClick={() => setReported(true)}>
                    Send report
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeReport}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack-12">
                <h2 className="card-title card-title-lg">Report sent</h2>
                <p className="body" role="status">
                  The safeguarding lead will follow up with you and your guardian. You can keep using Stride while
                  they look into it.
                </p>
                <button type="button" className="btn btn-primary" onClick={closeReport}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
