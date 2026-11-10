import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import Cover from '../components/Cover.jsx';
import FieldError from '../components/FieldError.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { reportReasons } from '../data.js';
import { lessonList, listedMentors, taskFor, threads } from '../api/selectors.js';
import { formatWhenShort } from '../api/dates.js';

function ProfileCard({ person }) {
  return (
    <a className="profile-card" href={`#/mentor/${person.id}`} aria-label={`View ${person.name}'s profile`}>
      <MentorAvatar size="xl" person={person} />
      <span className="stack-4 grow min-0">
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
  );
}

function ReportSheet({ api, mentorId, onClose }) {
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async () => {
    const message = await attempt(api.fileReport({ mentorId, reason, text }));
    if (message) setError(message);
    else setSent(true);
  };

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Report a concern">
        {!sent ? (
          <div className="stack-12">
            <h2 className="card-title card-title-lg">What happened?</h2>
            <p className="body-muted">Your report goes to the Stride safeguarding lead. The mentor does not see who sent it.</p>
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
            <label className="stack-8">
              <span className="field-label">Tell us more (optional)</span>
              <textarea className="textarea" rows="3" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            <FieldError>{error}</FieldError>
            <div className="row-8">
              <button type="button" className="btn btn-danger grow" disabled={!reason} onClick={send}>
                Send report
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="stack-12">
            <h2 className="card-title card-title-lg">Report sent</h2>
            <p className="body" role="status">
              The safeguarding lead will follow up with you and your guardian. You can keep using Stride while they look into it.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Mentor() {
  const { db, user: teen, api } = useBackend();
  const [reporting, setReporting] = useState(false);
  const mentor = teen.consent.mentor && teen.mentorId ? db.mentors[teen.mentorId] : null;
  const convos = threads(db, { teenId: teen.id }, 'teen');
  const others = listedMentors(db).filter((m) => m.id !== mentor?.id);
  const challenge = mentor
    ? [...lessonList(db)].reverse().find((l) => l.mentorId === mentor.id && taskFor(db, teen.id, l.id)?.status !== 'confirmed')
    : null;
  const blocked = teen.paused
    ? 'Your guardian paused your account, so messages are off for now.'
    : !teen.consent.messages
      ? 'Your guardian has turned off messages. You can still see your mentor’s lessons.'
      : null;

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Your mentor</h1>
      </header>

      {mentor ? (
        <>
          <ProfileCard person={mentor} />
          {blocked ? (
            <section className="callout" aria-label="Messages">
              <Icon name="lock" size={20} strokeWidth={1.6} />
              <p>{blocked}</p>
            </section>
          ) : (
            <a className="btn btn-primary" href={`#/chat/${mentor.id}`}>
              <Icon name="message" size={18} strokeWidth={1.8} />
              Message {mentor.first}
            </a>
          )}
        </>
      ) : (
        <section className="callout" aria-label="Your mentor">
          <Icon name="clock" size={20} strokeWidth={1.6} />
          <p>
            {teen.consent.mentor
              ? "We're matching you with a checked mentor. Pick what you're into in Account so we can find a good fit."
              : 'Your guardian has not turned on a mentor. They can do it in their Controls.'}
          </p>
        </section>
      )}

      <section className="callout" aria-label="How messages work">
        <Icon name="eye" size={20} strokeWidth={1.6} />
        <p>Messages stay inside Stride. Your guardian can read every one.</p>
      </section>

      {convos.length > 0 && (
        <>
          <h2 className="section-title">Conversations</h2>
          <section className="panel panel-list" aria-label="Conversations">
            {convos.map((t) => {
              const person = db.mentors[t.mentorId];
              return (
                <a key={t.mentorId} className="club-line" href={`#/chat/${t.mentorId}`}>
                  <MentorAvatar size="md" person={person} />
                  <span className="stack-2 grow min-0">
                    <span className="row-title">{person?.name}</span>
                    <span className="row-meta clamp-1">
                      {t.last.from === 'teen' ? 'You: ' : ''}
                      {t.last.text}
                    </span>
                  </span>
                  <span className="stack-2 end">
                    <span className="row-meta">{formatWhenShort(t.last.at)}</span>
                    {t.unread > 0 && <span className="count-pill">{t.unread}</span>}
                  </span>
                </a>
              );
            })}
          </section>
        </>
      )}

      {challenge && (
        <>
          <h2 className="section-title">Current challenge</h2>
          <a className="card list-row" href={`#/lesson/${challenge.id}`}>
            <Cover type={challenge.type} size="sm" image={challenge.image || undefined} />
            <div className="stack-2 grow">
              <span className="row-title">{challenge.title}</span>
              <span className="row-meta">
                {challenge.minutes} min lesson · Earns the {challenge.badge} badge
              </span>
            </div>
            <Icon name="arrowRight" size={20} />
          </a>
        </>
      )}

      {others.length > 0 && <h2 className="section-title">More mentors</h2>}
      {others.map((person) => (
        <ProfileCard key={person.id} person={person} />
      ))}

      <button type="button" className="btn btn-danger-outline" onClick={() => setReporting(true)}>
        <Icon name="flag" size={18} />
        Report a concern
      </button>

      {reporting && <ReportSheet api={api} mentorId={mentor?.id} onClose={() => setReporting(false)} />}
    </main>
  );
}
