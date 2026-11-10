import { Icon } from '../icons.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { useBackend } from '../api/index.jsx';
import { teensOf, threads } from '../api/selectors.js';
import { formatWhenShort } from '../api/dates.js';

// Every conversation between this guardian's teens and their mentors, read-only.
export default function GuardianMessages() {
  const { db, user } = useBackend();
  const teens = teensOf(db, user.id);
  const convos = threads(db, { teenIds: teens.map((t) => t.id) }, 'guardian');

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Messages</h1>
        <div className="subline">
          <span>
            <strong>Read-only</strong> · every mentor chat
          </span>
        </div>
      </header>

      <section className="callout" aria-label="How messages work">
        <Icon name="eye" size={20} strokeWidth={1.6} />
        <p>You can read every message between your teens and their mentors. Mentors know you can.</p>
      </section>

      {convos.length === 0 ? (
        <p className="body-muted empty">No messages yet.</p>
      ) : (
        <section className="panel panel-list" aria-label="Conversations">
          {convos.map((t) => {
            const teen = db.users[t.teenId];
            const mentor = db.mentors[t.mentorId];
            return (
              <a key={`${t.teenId}-${t.mentorId}`} className="club-line" href={`#/chat/${t.teenId}/${t.mentorId}`}>
                <MentorAvatar size="md" person={mentor} />
                <span className="stack-2 grow min-0">
                  <span className="row-title">
                    {teen?.name} and {mentor?.first}
                  </span>
                  <span className="row-meta clamp-1">
                    {t.last.from === 'mentor' ? mentor?.first : teen?.name}: {t.last.text}
                  </span>
                </span>
                <span className="row-meta end">{formatWhenShort(t.last.at)}</span>
              </a>
            );
          })}
        </section>
      )}
    </main>
  );
}
