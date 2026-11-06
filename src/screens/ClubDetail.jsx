import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function nextSessions(day, count = 2) {
  const date = new Date();
  date.setDate(date.getDate() + ((day - date.getDay() + 7) % 7));
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(date);
    d.setDate(date.getDate() + i * 7);
    return { key: d.toDateString(), weekday: weekdays[d.getDay()], date: d.getDate() };
  });
}

export default function ClubDetail({ club }) {
  const { state, set } = useStore();
  const sent = !!state.requested[club.id];
  const toggleRequest = () =>
    set((prev) => ({ requested: { ...prev.requested, [club.id]: !prev.requested[club.id] } }));

  return (
    <div className="detail">
      <main className="page">
        <NavBar title="Club" back="#/clubs" />
        <Cover type={club.type} size="lg" />
        <div className="detail-meta">
          <span className="kicker">{club.lead}</span>
          <span className="verified">
            <Icon name="shield" size={16} strokeWidth={2} />
            Verified
          </span>
        </div>
        <div className="stack-6">
          <h2 className="h1 h1-detail">{club.name}</h2>
          <p className="row-meta">
            {club.when} · {club.ages} · {club.type}
          </p>
        </div>
        <div className="stack-6">
          <h3 className="section-title">About this club</h3>
          <p className="body-muted">{club.about}</p>
        </div>
      </main>

      <section className="sheet-panel" aria-label="Upcoming sessions">
        <span className="handle" aria-hidden="true" />
        <h3 className="section-title">Upcoming sessions</h3>
        {nextSessions(club.day).map((s, i) => (
          <div className="session" key={s.key}>
            <span className={i === 0 ? 'date-chip is-next' : 'date-chip'}>
              <span>{s.weekday}</span>
              <strong>{s.date}</strong>
            </span>
            <div className="stack-2">
              <span className="row-title">{club.session}</span>
              <span className="row-meta">
                {club.time} · {club.confirmer} confirms attendance
              </span>
            </div>
          </div>
        ))}
        {!sent ? (
          <button type="button" className="btn btn-primary" onClick={toggleRequest}>
            Ask my guardian to approve
          </button>
        ) : (
          <div className="stack-2">
            <Status>Request sent. You can join once your guardian approves.</Status>
            <button type="button" className="link-btn" onClick={toggleRequest}>
              Cancel request
            </button>
          </div>
        )}
        <p className="fine">Your guardian gets the request in the app and on WhatsApp.</p>
      </section>
    </div>
  );
}
