import { Icon } from '../../icons.jsx';
import MeDot from '../../components/MeDot.jsx';
import { useBackend } from '../../api/index.jsx';
import { badgesFor, clubIdsOf, ledClubs, sessionsThisWeek, streak, teensOfMentor } from '../../api/selectors.js';

export default function MentorTeens() {
  const { db, user } = useBackend();
  const teens = teensOfMentor(db, user.mentorId);
  const led = new Set(ledClubs(db, user.mentorId).map((c) => c.id));

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Your teens</h1>
        <div className="subline">
          <span>
            <strong>{teens.length}</strong> mentees and club members
          </span>
        </div>
      </header>

      <section className="callout">
        <Icon name="shield" size={20} strokeWidth={1.6} />
        <p>You see nicknames only. Full names and contact details stay with each guardian.</p>
      </section>

      {teens.length === 0 ? (
        <p className="body-muted empty">No teens yet. Mentees and members of your clubs show up here.</p>
      ) : (
        <section className="panel panel-list" aria-label="Your teens">
          {teens.map((teen) => {
            const clubs = clubIdsOf(db, teen.id).filter((id) => led.has(id)).map((id) => db.clubs[id].shortName || db.clubs[id].name);
            return (
              <a key={teen.id} className="club-line" href={`#/chat/${teen.id}`}>
                <MeDot person={teen} />
                <span className="stack-2 grow min-0">
                  <span className="row-title">
                    {teen.nickname} {teen.mentorId === user.mentorId && <span className="tag tag-blue tag-tiny">Mentee</span>}
                  </span>
                  <span className="row-meta">
                    {clubs.length > 0 ? `${clubs.join(', ')} · ` : ''}
                    {sessionsThisWeek(db, teen.id)} of {teen.goal || 2} this week · {streak(db, teen)}-week streak ·{' '}
                    {badgesFor(db, teen.id).length} badges
                  </span>
                </span>
                <Icon name="message" size={18} strokeWidth={1.8} color="var(--subtle)" />
              </a>
            );
          })}
        </section>
      )}
    </main>
  );
}
