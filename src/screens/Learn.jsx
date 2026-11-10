import { Icon, PlayFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { useBackend } from '../api/index.jsx';
import { learnFilters } from '../data.js';
import { attendanceFor, badgesFor, lessonList, taskFor, teenLabel, weekHistory } from '../api/selectors.js';
import { formatShort } from '../api/dates.js';

function lessonTag(lesson, task) {
  const done = task ? Object.values(task.steps || {}).filter(Boolean).length : 0;
  if (task?.status === 'confirmed') return <span className="tag tag-green tag-inline">Badge earned</span>;
  if (task?.status === 'submitted') return <span className="tag tag-green tag-inline">Waiting to confirm</span>;
  if (task?.status === 'returned') return <span className="tag tag-warn-soft tag-inline">Sent back</span>;
  if (done > 0) return <span className="tag tag-blue tag-inline">{done} of {lesson.steps.length} steps</span>;
  return (
    <span className="tag tag-blue tag-inline">
      <Icon name="award" size={12} strokeWidth={2.2} /> {lesson.badge}
    </span>
  );
}

export default function Learn() {
  const { state, set } = useStore();
  const { db, user: teen } = useBackend();
  const lessons = lessonList(db);
  const filter = state.learnFilter;
  const savedCount = lessons.filter((l) => state.saved[l.id]).length;
  const task = (l) => taskFor(db, teen.id, l.id);
  const pending = lessons.filter((l) => task(l)?.status === 'submitted');
  const current = lessons.find((l) => ['draft', 'returned'].includes(task(l)?.status));
  const visible = lessons.filter((l) => (filter === 'All' ? true : filter === 'Saved' ? state.saved[l.id] : l.type === filter));
  const badges = badgesFor(db, teen.id);
  const sessions = attendanceFor(db, teen.id).length;
  const weeksOnGoal = weekHistory(db, teen, 52).filter((w) => w.met).length;
  const image = (lesson) => lesson.image || undefined;

  return (
    <main className="page">
      <div className="toolbar-row toolbar-row-split">
        <span className="offline-pill">
          <Icon name="download" size={15} strokeWidth={2} />
          {savedCount} saved, play with no data
        </span>
      </div>

      <header className="title-block">
        <h1 className="h1">Learn</h1>
        <div className="subline">
          <span>
            <strong>Short lessons</strong> from your mentors
          </span>
          <span>{lessons.length} lessons</span>
        </div>
      </header>

      {current && (
        <a className="continue" href={`#/lesson/${current.id}`} aria-label={`Continue ${current.title}`}>
          <Cover type={current.type} size="lg" image={image(current)} />
          <span className="continue-body">
            <span className="continue-eyebrow">
              Continue · {Object.keys(task(current).steps).length} of {current.steps.length} steps
            </span>
            <span className="continue-title">{current.title}</span>
            <span className="continue-progress" aria-hidden="true">
              <span style={{ width: `${(Object.keys(task(current).steps).length / current.steps.length) * 100}%` }} />
            </span>
          </span>
          <span className="continue-play" aria-hidden="true">
            <PlayFill size={20} />
          </span>
        </a>
      )}

      <div className="chips" role="group" aria-label="Filter lessons">
        {learnFilters.map((label) => (
          <button
            key={label}
            type="button"
            className={label === filter ? 'chip is-on' : 'chip'}
            aria-pressed={label === filter}
            onClick={() => set({ learnFilter: label })}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="lesson-grid">
          {visible.map((lesson) => (
            <a className="lesson-tile" key={lesson.id} href={`#/lesson/${lesson.id}`}>
              <Cover type={lesson.type} size="md" image={image(lesson)}>
                <span className="tag tag-dark lesson-time">
                  <PlayFill size={9} /> {lesson.minutes} min
                </span>
                {state.saved[lesson.id] && (
                  <span className="lesson-saved" aria-label="Saved offline">
                    <Icon name="check" size={12} strokeWidth={3} />
                  </span>
                )}
              </Cover>
              <span className="lesson-tile-body">
                <span className="lesson-tile-title">{lesson.title}</span>
                <span className="row-meta">{lesson.by}</span>
                {lessonTag(lesson, task(lesson))}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="body-muted empty">Nothing here yet. Save a lesson to play it with no data.</p>
      )}

      <SectionHead title="Your record" />
      <section className="record-card" aria-label="Your record">
        <div className="record-head">
          <span className="stack-2">
            <span className="record-name">{teenLabel(teen)}</span>
            <span className="record-sub">Stride record · every entry confirmed by an adult</span>
          </span>
          <Icon name="shield" size={22} strokeWidth={1.8} />
        </div>
        <div className="record-stats">
          <div>
            <span className="record-num num">{sessions}</span>
            <span className="record-sub">sessions</span>
          </div>
          <div>
            <span className="record-num num">{badges.length}</span>
            <span className="record-sub">badges</span>
          </div>
          <div>
            <span className="record-num num">{weeksOnGoal}</span>
            <span className="record-sub">weeks on goal</span>
          </div>
        </div>
        <ul className="record-list">
          {pending.map((lesson) => (
            <li key={lesson.id} className="is-pending">
              <span className="record-badge" aria-hidden="true">
                <Icon name="clock" size={16} strokeWidth={1.8} />
              </span>
              <span className="stack-2 grow">
                <span className="row-title">{lesson.badge}</span>
                <span className="record-sub">Waiting for {lesson.by} to confirm</span>
              </span>
            </li>
          ))}
          {badges.map((badge) => (
            <li key={badge.id}>
              <span className="record-badge" aria-hidden="true">
                <Icon name="award" size={16} strokeWidth={1.8} />
              </span>
              <span className="stack-2 grow">
                <span className="row-title">{badge.name}</span>
                <span className="record-sub">Signed off by {db.mentors[badge.mentorId]?.short || 'a mentor'}</span>
              </span>
              <span className="record-sub num">{formatShort(badge.at)}</span>
            </li>
          ))}
          {pending.length === 0 && badges.length === 0 && (
            <li>
              <span className="record-sub">Finish a lesson task to earn your first badge.</span>
            </li>
          )}
        </ul>
        {!teen.consent.record ? (
          <p className="record-sub">Ask your guardian if you want to share your record with a school.</p>
        ) : !state.recordShared ? (
          <button type="button" className="btn record-btn" onClick={() => set({ recordShared: true })}>
            <Icon name="send" size={18} strokeWidth={1.8} />
            Share with a school or employer
          </button>
        ) : (
          <Status>A read-only link was sent on WhatsApp. It shows confirmed entries only.</Status>
        )}
      </section>
    </main>
  );
}
