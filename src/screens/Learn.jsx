import { Icon, PlayFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { learnFilters, lessons, record } from '../data.js';
import { consentOf, isDemo, teenProfile } from '../teen.js';

const lessonImage = (lesson) => `lessons/${lesson.id}.webp`;

export default function Learn() {
  const { state, set, session, shareRecord } = useStore();
  const filter = state.learnFilter;
  const savedCount = lessons.filter((l) => state.saved[l.id]).length;
  const pending = lessons.filter((l) => state.taskDone[l.id] && !state.taskConfirmed?.[l.id]);
  const confirmedTasks = lessons.filter((l) => state.taskConfirmed?.[l.id]);
  const current = lessons.find((l) => l.watched > 0 && !state.taskDone[l.id]);
  const visible = lessons.filter((l) =>
    filter === 'All' ? true : filter === 'Saved' ? state.saved[l.id] : l.type === filter
  );
  const stepsDone = (lesson) => Object.values(state.steps[lesson.id] || {}).filter(Boolean).length;
  const teen = teenProfile(state);
  const sample = isDemo(state);
  const canShare = consentOf(state).record !== false;

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
          <Cover type={current.type} size="lg" image={lessonImage(current)} />
          <span className="continue-body">
            <span className="continue-eyebrow">
              Continue · {current.watched} of {current.minutes} min
            </span>
            <span className="continue-title">{current.title}</span>
            <span className="continue-progress" aria-hidden="true">
              <span style={{ width: `${(current.watched / current.minutes) * 100}%` }} />
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
          {visible.map((lesson) => {
            const done = stepsDone(lesson);
            return (
              <a className="lesson-tile" key={lesson.id} href={`#/lesson/${lesson.id}`}>
                <Cover type={lesson.type} size="md" image={lessonImage(lesson)}>
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
                  {state.taskConfirmed?.[lesson.id] ? (
                    <span className="tag tag-green tag-inline">Confirmed by {state.taskConfirmed[lesson.id].by}</span>
                  ) : state.taskDone[lesson.id] ? (
                    <span className="tag tag-green tag-inline">Waiting to confirm</span>
                  ) : done > 0 ? (
                    <span className="tag tag-blue tag-inline">
                      {done} of {lesson.steps.length} steps
                    </span>
                  ) : (
                    <span className="tag tag-blue tag-inline">
                      <Icon name="award" size={12} strokeWidth={2.2} /> {lesson.badge}
                    </span>
                  )}
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="body-muted empty">Nothing here yet. Save a lesson to play it with no data.</p>
      )}

      <SectionHead title="Your record" />
      <section className="record-card" aria-label="Your record">
        <div className="record-head">
          <span className="stack-2">
            <span className="record-name">{teen.recordName}</span>
            <span className="record-sub">Stride record · every entry confirmed by an adult</span>
          </span>
          <Icon name="shield" size={22} strokeWidth={1.8} />
        </div>
        <div className="record-stats">
          <div>
            <span className="record-num num">{sample ? record.sessions : (state.attendance || []).length}</span>
            <span className="record-sub">sessions</span>
          </div>
          <div>
            <span className="record-num num">{sample ? record.badges.length : 0}</span>
            <span className="record-sub">badges</span>
          </div>
          <div>
            <span className="record-num num">{sample ? record.weeks : 0}</span>
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
          {confirmedTasks.map((lesson) => (
            <li key={lesson.id}>
              <span className="record-badge" aria-hidden="true">
                <Icon name="check" size={16} strokeWidth={1.8} />
              </span>
              <span className="stack-2 grow">
                <span className="row-title">{lesson.title}</span>
                <span className="record-sub">Confirmed by {state.taskConfirmed[lesson.id].by.replace(/\.$/, '')}. This is not a badge.</span>
              </span>
            </li>
          ))}
          {sample && record.badges.map((badge) => (
            <li key={badge.name}>
              <span className="record-badge" aria-hidden="true">
                <Icon name="award" size={16} strokeWidth={1.8} />
              </span>
              <span className="stack-2 grow">
                <span className="row-title">{badge.name}</span>
                <span className="record-sub">Signed off by {badge.by}</span>
              </span>
              <span className="record-sub num">{badge.date}</span>
            </li>
          ))}
        </ul>
        {!canShare ? (
          <Status icon="lock">Your guardian has not allowed sharing this record.</Status>
        ) : !state.recordShared ? (
          <button
            type="button"
            className="btn record-btn"
            onClick={() => {
              if (session) shareRecord().catch(() => {});
              else set({ recordShared: true });
            }}
          >
            <Icon name="send" size={18} strokeWidth={1.8} />
            Share with a school or employer
          </button>
        ) : (
          <Status>
            {sample
              ? 'Your guardian can see that you asked to share. A school link is not sent from this sample.'
              : 'Your guardian can see that you asked to share. A school link is not connected, so nothing was sent.'}
          </Status>
        )}
      </section>
    </main>
  );
}
