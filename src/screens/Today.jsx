import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { useStore } from '../store.jsx';
import { useBackend } from '../api/index.jsx';
import { categories, clubFriends } from '../data.js';
import { clubIdsOf, lessonList, requestsFor, sessionsThisWeek, streak, taskFor, unreadCount, weekHistory } from '../api/selectors.js';

const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const WEEK_MS = 7 * 86400000;

export default function Today() {
  const { set } = useStore();
  const { db, user: teen } = useBackend();
  const now = new Date();
  const goal = teen.goal || 2;
  const done = sessionsThisWeek(db, teen.id, now);
  const myClubs = clubIdsOf(db, teen.id).map((id) => db.clubs[id]).filter(Boolean);
  const requests = requestsFor(db, teen.id);
  const waiting = requests.filter((r) => r.status === 'pending' && db.clubs[r.clubId]);
  const answers = requests.filter((r) => r.status !== 'pending' && r.decidedAt && now - new Date(r.decidedAt) < WEEK_MS && db.clubs[r.clubId]);
  const history = weekHistory(db, teen, 8, now);
  const past = history.slice(0, -1);
  const met = past.filter((w) => w.met).length;
  const run = streak(db, teen, now);
  const unread = unreadCount(db, { teenId: teen.id }, 'teen');
  const mentor = teen.consent.mentor && teen.mentorId ? db.mentors[teen.mentorId] : null;
  const challenge = mentor
    ? [...lessonList(db)].reverse().find((l) => l.mentorId === mentor.id && taskFor(db, teen.id, l.id)?.status !== 'confirmed')
    : null;

  const busyDays = new Set([...myClubs, ...waiting.map((r) => db.clubs[r.clubId])].map((c) => c.day));
  const freeDays = [1, 2, 3, 4, 5, 6].filter((d) => !busyDays.has(d)).slice(0, 2);
  const short = Math.max(0, goal - myClubs.length - waiting.length);
  const today = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/clubs" aria-label="Find a club">
            <Icon name="search" size={20} strokeWidth={1.8} />
          </a>
          <a href="#/mentor" className={unread ? 'has-dot' : undefined} aria-label={unread ? `${unread} new messages` : 'Messages'}>
            <Icon name="bell" size={20} strokeWidth={1.8} />
          </a>
          <a href="#/account" aria-label="Your account">
            <span className="me-dot" style={{ background: teen.color }}>
              {teen.nickname[0].toUpperCase()}
            </span>
          </a>
        </div>
      </div>

      <header className="title-block">
        <h1 className="h1">Hi, {teen.nickname}</h1>
        <div className="subline">
          <span>
            <strong>
              {done} of {goal} {goal === 1 ? 'session' : 'sessions'}
            </strong>{' '}
            this week
          </span>
          <span>{today}</span>
        </div>
        <div className="progress-line" role="progressbar" aria-label="Sessions this week" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}>
          <span style={{ width: `${Math.min(100, (done / goal) * 100)}%` }} />
        </div>
      </header>

      {answers.map((r) => {
        const club = db.clubs[r.clubId];
        return r.status === 'approved' ? (
          <Status key={r.id}>
            Your guardian said yes to {club.name}. See you on {club.when.split(',')[0].replace(/s$/, '')}.
          </Status>
        ) : (
          <Status key={r.id} icon="clock">
            Your guardian said not now to {club.name}. You can talk to them and ask again later.
          </Status>
        );
      })}

      <section className="card" aria-label="Your clubs this week">
        {myClubs.map((club) => {
          const friends = clubFriends[club.id] || [];
          return (
            <a className="list-row" key={club.id} href={`#/club/${club.id}`}>
              <Cover type={club.type} size="sm" photo={club.id} />
              <span className="stack-2 grow">
                <span className="row-title">{club.shortName || club.name}</span>
                <span className="row-meta">{club.short}</span>
                {friends.length > 0 && <span className="tag tag-keen tag-inline">With {friends.join(' & ')}</span>}
              </span>
              <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
            </a>
          );
        })}
        {waiting.map((r) => {
          const club = db.clubs[r.clubId];
          return (
            <a className="list-row" key={r.id} href={`#/club/${club.id}`}>
              <Cover type={club.type} size="sm" photo={club.id} />
              <span className="stack-2 grow">
                <span className="row-title">{club.shortName || club.name}</span>
                <span className="row-meta">{club.short}</span>
                <span className="tag tag-warn-soft tag-inline">Waiting for your guardian</span>
              </span>
              <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
            </a>
          );
        })}
        {myClubs.length === 0 && waiting.length === 0 && (
          <p className="row-meta empty">No clubs yet. Find one you like and ask your guardian.</p>
        )}
        {short > 0 && (
          <a className="list-row list-row-add" href="#/clubs">
            <span className="add-tile" aria-hidden="true">
              <Icon name="plus" size={18} strokeWidth={2} />
            </span>
            <span className="stack-2 grow">
              <span className="row-title">
                {short === 1 ? 'One more club' : `${short} more clubs`} to hit your goal
              </span>
              {freeDays.length > 0 && (
                <span className="row-meta">Find a club for {freeDays.map((d) => dayNames[d].slice(0, -1)).join(' or ')}</span>
              )}
            </span>
          </a>
        )}
      </section>

      <section className="card streak" aria-label="Weekly streak">
        <span className="stack-2 grow">
          <span className="row-title">{run === 0 ? 'Start a streak this week' : run === 1 ? '1-week streak' : `${run}-week streak`}</span>
          <span className="row-meta">
            Goal met in {met} of the last {past.length} weeks
          </span>
        </span>
        <span className="weeks" aria-hidden="true">
          {history.map((w) => (
            <span key={w.key} className={w.current ? (w.met ? 'week is-met is-current' : 'week is-current') : w.met ? 'week is-met' : 'week'} />
          ))}
        </span>
      </section>

      <a className="promo" href="#/swipe">
        <span className="promo-icon" aria-hidden="true">
          <HeartFill size={20} />
        </span>
        <span className="stack-2 grow">
          <span className="row-title">Swipe through clubs</span>
          <span className="promo-sub">Heart the ones you like. Your guardian decides.</span>
        </span>
        <Icon name="arrowRight" size={18} strokeWidth={2} />
      </a>

      {challenge && (
        <>
          <SectionHead title="From your mentor" />
          <section className="card card-pad" aria-label="Mentor challenge">
            <a href={`#/mentor/${mentor.id}`} className="row-center" aria-label={`${mentor.name}'s profile`}>
              <MentorAvatar size="sm" person={mentor} />
              <span className="row-meta">{mentor.name} set you a challenge</span>
            </a>
            <p className="panel-title">{challenge.title}</p>
            <p className="body-muted">
              {challenge.task} {mentor.first} confirms it and you earn the {challenge.badge} badge.
            </p>
            <a className="btn btn-primary btn-sm" href={`#/lesson/${challenge.id}`}>
              {taskFor(db, teen.id, challenge.id) ? 'Keep going' : 'Start lesson'}
            </a>
          </section>
        </>
      )}

      <SectionHead title="Browse" />
      <div className="cat-grid">
        {categories.map((cat) => (
          <a
            key={cat.id}
            className={teen.interests.includes(cat.id) ? 'cat is-fav' : 'cat'}
            href="#/clubs"
            onClick={() => set({ clubFilter: cat.id })}
          >
            <Cover type={cat.id} size="sm" />
            <span>{cat.id}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
