import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import SectionHead from '../../components/SectionHead.jsx';
import FieldError from '../../components/FieldError.jsx';
import MentorAvatar from '../../components/MentorAvatar.jsx';
import MeDot from '../../components/MeDot.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { ledClubs, membersOf, tasksToReview, teensOfMentor, unreadCount } from '../../api/selectors.js';
import { addDays, formatDay, formatWhenShort, isoDate, lastSessionDate } from '../../api/dates.js';

function TaskCard({ db, task, api }) {
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const teen = db.users[task.teenId];
  const lesson = db.lessons[task.lessonId];

  const review = async (approve) => {
    setBusy(true);
    setError(await attempt(api.reviewTask(task.id, { approve, note })));
    setBusy(false);
  };

  return (
    <section className="panel stack-12" aria-label={`${teen?.nickname}: ${lesson.title}`}>
      <div className="row-item">
        <MeDot person={teen} />
        <span className="stack-2 grow min-0">
          <span className="row-title">{teen?.nickname || 'A teen'}</span>
          <span className="row-meta">
            {lesson.title} · sent {formatWhenShort(task.submittedAt)}
          </span>
        </span>
      </div>
      <ul className="checks">
        {lesson.steps.map((step, i) => (
          <li key={`${i}-${step}`} className={task.steps[i] ? undefined : 'is-off'}>
            <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
            {step}
          </li>
        ))}
      </ul>
      {sending ? (
        <div className="stack-8">
          <label className="stack-8">
            <span className="field-label">What should {teen?.nickname} change?</span>
            <textarea className="textarea" rows="2" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="row-8">
            <button type="button" className="btn btn-primary grow" disabled={!note.trim() || busy} onClick={() => review(false)}>
              Send back
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSending(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="row-8">
          <button type="button" className="btn btn-ghost" onClick={() => setSending(true)}>
            Send back
          </button>
          <button type="button" className="btn btn-primary grow" disabled={busy} onClick={() => review(true)}>
            <Icon name="award" size={18} strokeWidth={1.8} />
            Confirm badge
          </button>
        </div>
      )}
      <FieldError>{error}</FieldError>
    </section>
  );
}

function Register({ db, club, api }) {
  const [weeksBack, setWeeksBack] = useState(0);
  const [error, setError] = useState(null);
  const date = isoDate(addDays(lastSessionDate(club.day), -7 * weeksBack));
  const members = membersOf(db, club.id);
  const here = new Set(Object.values(db.attendance).filter((a) => a.clubId === club.id && a.date === date).map((a) => a.teenId));
  const mark = async (teenId) => setError(await attempt(api.setAttendance({ teenId, clubId: club.id, date, present: !here.has(teenId) })));

  return (
    <section className="panel stack-12" aria-label={`${club.name} register`}>
      <div className="panel-head">
        <h3 className="section-title">{club.name}</h3>
        <span className="row-meta num">
          {members.filter((m) => here.has(m.id)).length} of {members.length} here
        </span>
      </div>
      <div className="week-switch">
        <button type="button" className="icon-btn" aria-label="Earlier session" disabled={weeksBack >= 8} onClick={() => setWeeksBack((w) => w + 1)}>
          <Icon name="back" size={18} />
        </button>
        <span className="row-title">{weeksBack === 0 ? `Latest · ${formatDay(date)}` : formatDay(date)}</span>
        <button type="button" className="icon-btn" aria-label="Later session" disabled={weeksBack === 0} onClick={() => setWeeksBack((w) => w - 1)}>
          <Icon name="back" size={18} className="flip" />
        </button>
      </div>
      {members.length === 0 ? (
        <p className="row-meta">No members on Stride yet.</p>
      ) : (
        <ul className="register">
          {members.map((teen) => (
            <li key={teen.id}>
              <MeDot person={teen} />
              <span className="row-title grow">{teen.nickname}</span>
              <button
                type="button"
                className={here.has(teen.id) ? 'chip is-on' : 'chip'}
                aria-pressed={here.has(teen.id)}
                onClick={() => mark(teen.id)}
              >
                {here.has(teen.id) ? '✓ Here' : 'Mark here'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldError>{error}</FieldError>
    </section>
  );
}

export default function MentorHome() {
  const { db, user, api } = useBackend();
  const profile = db.mentors[user.mentorId];
  const tasks = tasksToReview(db, user.mentorId);
  const unread = unreadCount(db, { mentorId: user.mentorId }, 'mentor');
  const teens = teensOfMentor(db, user.mentorId);
  const clubs = ledClubs(db, user.mentorId);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/account" aria-label="Your account">
            <MentorAvatar size="sm" person={profile} />
          </a>
        </div>
      </div>

      <header className="title-block">
        <h1 className="h1">Hi, {profile.first}</h1>
        <div className="subline">
          <span className="tag tag-blue">
            <Icon name="shield" size={12} strokeWidth={2.4} />
            {profile.badge}
          </span>
          <span>{today}</span>
        </div>
      </header>

      <div className="mentor-stats">
        <div>
          <strong className="num">{tasks.length}</strong>
          <span>to confirm</span>
        </div>
        <a href="#/inbox">
          <strong className="num">{unread}</strong>
          <span>new messages</span>
        </a>
        <a href="#/teens">
          <strong className="num">{teens.length}</strong>
          <span>teens</span>
        </a>
      </div>

      <SectionHead title="Tasks to confirm" />
      {tasks.length === 0 ? (
        <p className="body-muted">Nothing waiting. When a teen sends a lesson task, it shows up here.</p>
      ) : (
        tasks.map((t) => <TaskCard key={t.id} db={db} task={t} api={api} />)
      )}

      <SectionHead title="Register" />
      {clubs.length === 0 ? (
        <section className="callout">
          <Icon name="clipboard" size={20} strokeWidth={1.6} />
          <p>You don't lead a club, so there's no register to fill in. Club leaders confirm sessions here.</p>
        </section>
      ) : (
        clubs.map((club) => <Register key={club.id} db={db} club={club} api={api} />)
      )}
    </main>
  );
}
