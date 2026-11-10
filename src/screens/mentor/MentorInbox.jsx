import MeDot from '../../components/MeDot.jsx';
import { useBackend } from '../../api/index.jsx';
import { teensOfMentor, threads } from '../../api/selectors.js';
import { formatWhenShort } from '../../api/dates.js';

export default function MentorInbox() {
  const { db, user } = useBackend();
  const convos = threads(db, { mentorId: user.mentorId }, 'mentor');
  const talking = new Set(convos.map((t) => t.teenId));
  const others = teensOfMentor(db, user.mentorId).filter((t) => !talking.has(t.id));

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Messages</h1>
        <div className="subline">
          <span>Guardians can read every message</span>
        </div>
      </header>

      {convos.length === 0 ? (
        <p className="body-muted empty">No conversations yet.</p>
      ) : (
        <section className="panel panel-list" aria-label="Conversations">
          {convos.map((t) => {
            const teen = db.users[t.teenId];
            return (
              <a key={t.teenId} className="club-line" href={`#/chat/${t.teenId}`}>
                <MeDot person={teen} />
                <span className="stack-2 grow min-0">
                  <span className="row-title">{teen?.nickname || 'Teen'}</span>
                  <span className="row-meta clamp-1">
                    {t.last.from === 'mentor' ? 'You: ' : ''}
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
      )}

      {others.length > 0 && (
        <>
          <h2 className="section-title">Start a conversation</h2>
          <div className="wrap-chips">
            {others.map((teen) => (
              <a key={teen.id} className="chip" href={`#/chat/${teen.id}`}>
                <span className="kid-dot" style={{ background: teen.color }} aria-hidden="true" />
                {teen.nickname}
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
