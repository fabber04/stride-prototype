import { useState } from 'react';
import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { clubChecks, clubCost, clubFriends, clubSpots } from '../data.js';
import { explain } from '../api.js';
import { consentOf, isDemo, requestBlock } from '../teen.js';

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
  const { state, set, session, requestClub, withdrawRequest } = useStore();
  const [problem, setProblem] = useState('');
  const sent = !!state.requested[club.id];
  const decision = state.decisions[club.id];
  const cost = clubCost[club.id];
  const friends = clubFriends[club.id] || [];
  const spots = clubSpots[club.id];
  const block = requestBlock(state, club);
  const summaryOn = consentOf(state).summary !== false;
  const sample = isDemo(state);
  const ask = async () => {
    setProblem('');
    if (!session) {
      set((prev) => ({ requested: { ...prev.requested, [club.id]: !prev.requested[club.id] } }));
      return;
    }
    try {
      if (sent && !decision) await withdrawRequest(club.id);
      else await requestClub(club.id);
    } catch (error) {
      setProblem(explain(error, club));
    }
  };

  return (
    <div className="detail">
      <main className="page">
        <NavBar title={club.type} back="#/clubs" />
        <Cover type={club.type} size="lg" photo={club.id}>
          {spots && (
            <span className="over over-left">
              <span className="tag tag-warn">{spots === 1 ? '1 place left' : `${spots} places left`}</span>
            </span>
          )}
        </Cover>

        <div className="stack-8">
          <span className="tag tag-blue">
            <Icon name="shield" size={12} strokeWidth={2.4} />
            {sample ? 'Verified' : 'Sample club'}
          </span>
          <h2 className="h1 h1-detail">{club.name}</h2>
          <p className="row-meta">
            {club.lead} · {club.when} · {club.ages}
          </p>
          {friends.length > 0 && (
            <span className="tag tag-keen tag-inline">
              <HeartFill size={12} />
              {friends.join(' & ')} {friends.length > 1 ? 'go' : 'goes'} here
            </span>
          )}
        </div>

        <p className="body">{club.about}</p>

        {sample ? (
          <section className="panel" aria-label="Checked before joining Stride">
            <div className="panel-head">
              <h3 className="section-title">Checked before joining Stride</h3>
              <Icon name="shield" size={18} strokeWidth={1.6} color="var(--accent)" />
            </div>
            <ul className="checks">
              {clubChecks(club).map((item) => (
                <li key={item}>
                  <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="fine fine-left">This club is sample data. A leader still has to accept your teen after a guardian approves.</p>
        )}

        <section className="cost" aria-label="Cost">
          <span className="cost-price">{cost.price}</span>
          <span className="row-meta">{cost.note}</span>
        </section>
      </main>

      <section className="sheet-panel" aria-label="Upcoming sessions">
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
        {session?.role === 'guardian' ? (
          <Status>Club requests are sent from the teen's phone.</Status>
        ) : block && !sent && !decision ? (
          <Status icon="lock">{block}</Status>
        ) : decision === 'approved' ? (
          <Status>Your guardian approved this. You can join from {club.when.split(',')[0].replace(/s$/, '')}.</Status>
        ) : decision === 'declined' ? (
          <div className="stack-2">
            <Status>Your guardian said not now.</Status>
            <button type="button" className="link-btn" onClick={ask}>
              Ask again
            </button>
          </div>
        ) : !sent ? (
          <button type="button" className="btn btn-primary" onClick={ask}>
            Ask my guardian to approve
          </button>
        ) : (
          <div className="stack-2">
            <Status>Request sent. You can join once your guardian approves.</Status>
            {!decision && (
              <button type="button" className="link-btn" onClick={ask}>
                Cancel request
              </button>
            )}
          </div>
        )}
        {problem && <Status icon="lock">{problem}</Status>}
        <p className="fine">
          {summaryOn
            ? 'Your guardian gets the request in the app. WhatsApp is not connected.'
            : 'Your guardian gets the request in the app.'}
        </p>
      </section>
    </div>
  );
}
