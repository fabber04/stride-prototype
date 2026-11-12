import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import Cover from '../components/Cover.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { useStore } from '../store.jsx';
import { mentor, mentorById, mentors, reportReasons } from '../data.js';
import { formatWhen } from '../onboarding.js';
import { explain } from '../api.js';
import { messageRecord, reportRecord } from '../records.js';
import { isDemo, messageBlock, teenProfile } from '../teen.js';

export default function Mentor({ composeId }) {
  const { state, set: save, session, sendMessage: postMessage, sendReport: postReport } = useStore();
  const openedFor = mentorById[composeId];
  // idle -> composing -> sent | held. #/ask/charlene opens a note to that mentor.
  const [message, setMessage] = useState(openedFor ? 'composing' : 'idle');
  const [draft, setDraft] = useState('');
  const [last, setLast] = useState(null);
  const [recipientId, setRecipientId] = useState(openedFor ? openedFor.id : mentor.id);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState('');
  const teen = teenProfile(state).nickname;
  const block = session?.role === 'guardian' ? "Messages are sent from the teen's phone." : messageBlock(state);
  const sample = isDemo(state);
  const [problem, setProblem] = useState('');
  const thread = (state.messages || []).filter((item) => item.to === recipientId).slice().reverse();

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
    if (openedFor && !messageBlock(state)) {
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

  const send = async () => {
    const text = draft.trim();
    if (!text || block) return;
    setProblem('');
    if (session) {
      try {
        const result = await postMessage(recipient.id, text);
        const record = [...(result.state.messages || [])].reverse().find((item) => item.to === recipient.id && item.text === text);
        setLast(record || null);
        setDraft('');
        setMessage(record?.status === 'held' ? 'held' : 'sent');
        if (window.location.hash.startsWith('#/ask')) window.location.hash = '#/mentor';
      } catch (error) {
        setProblem(explain(error));
      }
      return;
    }
    const record = messageRecord({ from: teen, to: recipient.id, text });
    save((prev) => ({ messages: [...(prev.messages || []), record] }));
    setLast(record);
    setDraft('');
    setMessage(record.status === 'held' ? 'held' : 'sent');
    if (window.location.hash.startsWith('#/ask')) window.location.hash = '#/mentor';
  };

  const sendReport = async () => {
    if (!reason) return;
    if (session) {
      try {
        await postReport(reason);
        setReported(true);
      } catch (error) {
        setProblem(explain(error));
      }
      return;
    }
    const record = reportRecord({ by: teen, reason });
    save((prev) => ({ reports: [...(prev.reports || []), record] }));
    setReported(true);
  };

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Your mentor</h1>
      </header>

      <a className="profile-card" href="#/mentor/profile" aria-label={`View ${mentor.name}'s profile`}>
        <MentorAvatar size="xl" />
        <span className="stack-4 grow">
          <span className={sample ? 'profile-name name-verified' : 'profile-name'}>
            {mentor.name}
            {sample && (
              <span className="verified-tick" aria-hidden="true">
                <Icon name="check" size={11} strokeWidth={3.4} />
              </span>
            )}
          </span>
          <span className="row-meta">{mentor.role}</span>
          <span className="tag tag-blue tag-inline">
            <Icon name="shield" size={12} strokeWidth={2.4} />
            {sample ? mentor.badge : 'Not checked for this family'}
          </span>
        </span>
        <Icon name="arrowRight" size={18} strokeWidth={2} color="var(--subtle)" />
      </a>

      {sample ? (
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
      ) : (
        <p className="fine fine-left">These mentors are sample profiles. Nobody has been checked for this family.</p>
      )}

      {others.length > 0 && <h2 className="section-title">More mentors</h2>}
      {others.map((person) => (
        <a className="profile-card" key={person.id} href={`#/mentor/${person.id}`} aria-label={`View ${person.name}'s profile`}>
          <MentorAvatar size="xl" person={person} />
          <span className="stack-4 grow">
            <span className={sample ? 'profile-name name-verified' : 'profile-name'}>
              {person.name}
              {sample && (
                <span className="verified-tick" aria-hidden="true">
                  <Icon name="check" size={11} strokeWidth={3.4} />
                </span>
              )}
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
        <p>Messages stay inside Stride. Your guardian can read every one, including after you close the app.</p>
      </section>

      {block && <Status icon="lock">{block}</Status>}

      {!block && message === 'idle' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setRecipientId(mentor.id);
            setLast(null);
            setMessage('composing');
          }}
        >
          Ask a question
        </button>
      )}

      {!block && message === 'composing' && (
        <section className="panel" aria-label="New message">
          <label htmlFor="question" className="field-label">Your question for {recipient.first}</label>
          <textarea
            id="question"
            className="textarea"
            rows="3"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="For example: can I use my own laptop on Wednesday?"
          />
          <p className="small muted">Your guardian will see this message.</p>
          {problem && <Status icon="lock">{problem}</Status>}
          <div className="row-8">
            <button type="button" className="btn btn-primary grow" onClick={send} disabled={!draft.trim()}>
              Send
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDraft('');
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

      {message === 'sent' && last && (
        <div className="stack-4">
          <Status>Sent to {recipient.first}. Your guardian can see it too.</Status>
          <button type="button" className="link-btn" onClick={() => setMessage('composing')}>
            Ask another question
          </button>
        </div>
      )}

      {message === 'held' && last && (
        <div className="stack-4">
          <Status icon="lock">
            Held for your guardian. {last.flag}, so {recipient.first} will not see it until they allow it.
          </Status>
          <button type="button" className="link-btn" onClick={() => setMessage('composing')}>
            Write a different question
          </button>
        </div>
      )}

      {thread.length > 0 && (
        <>
          <h2 className="section-title">Messages with {recipient.first}</h2>
          <section className="panel panel-list" aria-label={`Messages with ${recipient.first}`}>
            {thread.map((item) => (
              <div className="club-line" key={item.id}>
                <div className="stack-2">
                  <span className="row-title">{item.text}</span>
                  <span className="row-meta">
                    {item.status === 'held' && `Held · ${item.flag}`}
                    {item.status === 'blocked' && 'Not sent. Your guardian stopped it.'}
                    {item.status === 'sent' && 'Sent · your guardian can read it'}
                    {' · '}
                    {formatWhen(item.at)}
                  </span>
                </div>
              </div>
            ))}
          </section>
        </>
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
                  This report is queued on the family record. The mentor cannot read it. A person is not notified until a safeguarding queue is connected.
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
                  <button type="button" className="btn btn-danger grow" onClick={sendReport} disabled={!reason}>
                    Send report
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeReport}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack-12">
                <h2 className="card-title card-title-lg">Report queued</h2>
                <p className="body" role="status">
                  Your guardian can see this report. A person has not been notified, because no safeguarding queue is connected yet.
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
