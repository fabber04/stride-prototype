import { Icon, PlayFill } from '../../icons.jsx';
import Cover from '../../components/Cover.jsx';
import { useBackend } from '../../api/index.jsx';
import { mentorLessons } from '../../api/selectors.js';

export default function MentorLessons() {
  const { db, user } = useBackend();
  const lessons = mentorLessons(db, user.mentorId);
  const tasks = Object.values(db.tasks);
  const badges = Object.values(db.badges);

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Lessons</h1>
        <div className="subline">
          <span>
            <strong>{lessons.length}</strong> {lessons.length === 1 ? 'lesson' : 'lessons'} by you
          </span>
        </div>
      </header>

      <a className="btn btn-primary" href="#/lessons/new">
        <Icon name="plus" size={18} strokeWidth={2} />
        New lesson
      </a>

      {lessons.length === 0 ? (
        <p className="body-muted empty">Make a short lesson with an offline task. Teens earn a badge when you confirm it.</p>
      ) : (
        <section className="card" aria-label="Your lessons">
          {lessons.map((lesson) => {
            const earned = badges.filter((b) => b.lessonId === lesson.id).length;
            const waiting = tasks.filter((t) => t.lessonId === lesson.id && t.status === 'submitted').length;
            return (
              <a key={lesson.id} className="list-row" href={`#/lesson/${lesson.id}`}>
                <Cover type={lesson.type} size="sm" image={lesson.image || undefined} />
                <span className="stack-2 grow min-0">
                  <span className="row-title">{lesson.title}</span>
                  <span className="row-meta">
                    <PlayFill size={9} /> {lesson.minutes} min · {earned} {lesson.badge} {earned === 1 ? 'badge' : 'badges'} earned
                  </span>
                  {waiting > 0 && <span className="tag tag-warn-soft tag-inline">{waiting} waiting to confirm</span>}
                </span>
                <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
              </a>
            );
          })}
        </section>
      )}
    </main>
  );
}
