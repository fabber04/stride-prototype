import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import FieldError from '../components/FieldError.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import MeDot from '../components/MeDot.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { mentorCanReach } from '../api/rules.js';
import { thread } from '../api/selectors.js';
import { formatDay, formatTime, isoDate } from '../api/dates.js';

// One conversation between a teen and a mentor. Teens and mentors write; guardians read.
export default function Chat({ teenId, mentorId, readOnly = false }) {
  const { db, user, api } = useBackend();
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const teen = db.users[teenId];
  const mentor = db.mentors[mentorId];
  const messages = thread(db, teenId, mentorId);
  const side = user.role === 'mentor' ? 'mentor' : 'teen';
  const unread = messages.filter((m) => m.from !== side && !m.readAt).length;
  const back = user.role === 'mentor' ? '#/inbox' : user.role === 'guardian' ? '#/messages' : '#/mentor';

  useEffect(() => {
    if (!readOnly && unread > 0) api.markThreadRead(teenId, mentorId).catch(() => {});
  }, [readOnly, unread, teenId, mentorId, api]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  let blocked = null;
  if (!readOnly && teen) {
    if (user.role === 'teen') {
      if (teen.paused) blocked = 'Your guardian paused your account, so messages are off for now.';
      else if (!teen.consent.messages) blocked = 'Your guardian has turned off messages.';
    } else if (!teen.consent?.messages) blocked = `Messages are off. ${teen.nickname}'s guardian has turned off messages.`;
    else if (teen.paused) blocked = `${teen.nickname}'s account is paused, so messages are off for now.`;
    else if (!mentorCanReach(db, mentorId, teen)) blocked = `You can message ${teen.nickname} once they're in one of your clubs.`;
  }

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    const message = await attempt(api.sendMessage({ teenId, mentorId, text }));
    setBusy(false);
    setError(message);
    if (!message) setText('');
  };

  const title = user.role === 'mentor' ? teen?.nickname || 'Teen' : mentor?.first || 'Mentor';
  let lastDay = null;

  return (
    <div className="detail">
      <main className="page">
        <NavBar title={title} back={back} />

        {user.role === 'mentor' ? (
          <div className="confirmer">
            <MeDot person={teen} large />
            <span className="stack-2 grow">
              <span className="row-title">{teen?.nickname}</span>
              <span className="row-meta">{teen?.mentorId === mentorId ? 'Your mentee' : 'In one of your clubs'}</span>
            </span>
          </div>
        ) : (
          <a className="confirmer" href={`#/mentor/${mentorId}`}>
            <MentorAvatar size="md" person={mentor} />
            <span className="stack-2 grow">
              <span className="row-title">{readOnly ? `${teen?.name} and ${mentor?.name}` : mentor?.name}</span>
              <span className="row-meta">{mentor?.role}</span>
            </span>
            <Icon name="shield" size={20} strokeWidth={1.8} color="var(--accent)" />
          </a>
        )}

        <section className="callout" aria-label="Who can see this">
          <Icon name="eye" size={20} strokeWidth={1.6} />
          <p>
            {readOnly
              ? 'You can read every message. Only your teen and their mentor can write here.'
              : user.role === 'mentor'
                ? `${teen?.nickname}'s guardian can read everything in this chat.`
                : 'Your guardian can read everything in this chat.'}
          </p>
        </section>

        <ol className="chat" aria-label="Messages">
          {messages.length === 0 && <li className="row-meta center">No messages yet. Say hello.</li>}
          {messages.map((m) => {
            const day = isoDate(new Date(m.at));
            const showDay = day !== lastDay;
            lastDay = day;
            const own = !readOnly && m.from === side;
            return (
              <li key={m.id} className="stack-4">
                {showDay && <span className="bubble-day">{formatDay(m.at)}</span>}
                <div className={`bubble ${own ? 'is-own' : m.from === 'mentor' ? 'is-mentor' : ''}`}>
                  {readOnly && <span className="bubble-who">{m.from === 'mentor' ? mentor?.first : teen?.name}</span>}
                  <span>{m.text}</span>
                  <span className="bubble-time">{formatTime(m.at)}</span>
                </div>
              </li>
            );
          })}
          <li ref={end} aria-hidden="true" />
        </ol>
      </main>

      {!readOnly && (
        <div className="detail-footer">
          {blocked ? (
            <section className="callout callout-warn" role="status">
              <Icon name="lock" size={20} strokeWidth={1.6} />
              <p>{blocked}</p>
            </section>
          ) : (
            <form className="composer" onSubmit={send}>
              <label className="visually-hidden" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="textarea composer-input"
                rows="1"
                maxLength={1000}
                placeholder={user.role === 'mentor' ? `Message ${teen?.nickname}` : `Message ${mentor?.first}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) send(e);
                }}
              />
              <button type="submit" className="composer-send" aria-label="Send" disabled={!text.trim() || busy}>
                <Icon name="send" size={18} strokeWidth={2} />
              </button>
            </form>
          )}
          <FieldError>{error}</FieldError>
        </div>
      )}
    </div>
  );
}
