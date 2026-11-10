import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import Cover from '../components/Cover.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { mentor, mentorById, mentors, reportReasons } from '../data.js';

export default function Mentor({ composeId }) {
  const openedFor = mentorById[composeId];
  // idle -> composing -> sent. #/ask/charlene opens a note to that mentor.
  const [message, setMessage] = useState(openedFor ? 'composing' : 'idle');
  const [recipientId, setRecipientId] = useState(openedFor ? openedFor.id : mentor.id);
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

  useEffect(() => {
    if (openedFor) {
      setRecipientId(openedFor.id);
      setMessage('composing');
    }
  }, [composeId]);

  useEffect(() => {
    if (message === 'composing' && composeId) {
      document.getElementById('question')?.scrollIntoView({ block: 'center' });
    }
  }, [message, composeId]);

  const recipient = mentorById[recipientId] || mentor;
  const others = mentors.filter((person) => person.id !== mentor.id);

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Your mentor</h1>
      </header>

      <a className="profile-card" href="#/mentor/profile" aria-label={`View ${mentor.name}'s profile`}>
        <MentorAvatar size="xl" />
        <span className="stack-4 grow">
          <span className="profile-name name-verified">
            {mentor.name}
            <span className="verified-tick" aria-hidden="true">
              <Icon name="check" size={11} strokeWidth={3.4} />
            </span>
          </span>
          <span className="row-meta">{mentor.role}</span>
          <span className="tag tag-blue tag-inline">
            <Icon name="shield" size={12} strokeWidth={2.4} />
            {mentor.badge}
          </span>
        </span>
        <Icon name="arrowRight" size={18} strokeWidth={2} color="var(--subtle)" />
      </a>

      <section className="panel" aria-label="Checked before joining Stride">
        <div className="panel-head">
          <h2 className="section-title">Checked before joining Stride</h2>
          <Icon name="shield" size={18} strokeWidth={1.6} color="var(--accent)" />
        </div>
        <ul className="checks">
          {mentor.checks.slice(0, 3).map((item) => (
            <li key={item}>
              <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {others.length > 0 && <h2 className="section-title">More mentors</h2>}
      {others.map((person) => (
        <a className="profile-card" key={person.id} href={`#/mentor/${person.id}`} aria-label={`View ${person.name}'s profile`}>
          <MentorAvatar size="xl" person={person} />
          <span className="stack-4 grow">
            <span className="profile-name name-verified">
              {person.name}
              <span className="verified-tick" aria-hidden="true">
                <Icon name="check" size={11} strokeWidth={3.4} />
              </span>
            </span>
            <span className="row-meta">{person.role}</span>
            <span className="tag tag-blue tag-inline">
              <Icon name="shield" size={12} strokeWidth={2.4} />
              {person.badge}
            </span>
          </span>
          <Icon name="arrowRight" size={18} strokeWidth={2} color="var(--subtle)" />
        </a>
      ))}

      <section className="callout" aria-label="How messages work">
        <Icon name="eye" size={20} strokeWidth={1.6} />
        <p>Messages stay inside Stride. Your guardian can read every one.</p>
      </section>

      {message === 'idle' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setRecipientId(mentor.id);
            setMessage('composing');
          }}
        >
          Ask a question
        </button>
      )}

      {message === 'composing' && (
        <section className="panel" aria-label="New message">
          <label htmlFor="question" className="field-label">Your question for {recipient.first}</label>
          <textarea
            id="question"
            className="textarea"
            rows="3"
            placeholder="For example: can I use my own laptop on Wednesday?"
          />
          <p className="small muted">Your guardian will see this message.</p>
          <div className="row-8">
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                setMessage('sent');
                if (window.location.hash.startsWith('#/ask')) window.location.hash = '#/mentor';
              }}
            >
              Send
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setRecipientId(mentor.id);
                setMessage('idle');
                if (window.location.hash.startsWith('#/ask')) window.location.hash = '#/mentor';
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {message === 'sent' && (
        <div className="stack-4">
          <Status>Sent to {recipient.first}. Your guardian can see it too.</Status>
          <button type="button" className="link-btn" onClick={() => setMessage('composing')}>
            Ask another question
          </button>
        </div>
      )}

      <h2 className="section-title">Current challenge</h2>
      <a className="card list-row" href="#/lesson/python">
        <Cover type="Tech" size="sm" image="lessons/python.webp" />
        <div className="stack-2 grow">
          <span className="row-title">Build a quiz in 20 lines of Python</span>
          <span className="row-meta">6 min lesson · Earns the Builder badge</span>
        </div>
        <Icon name="arrowRight" size={20} />
      </a>

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
