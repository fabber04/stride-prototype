import { useState } from 'react';
import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import FieldError from '../components/FieldError.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { clubChecks, clubFriends } from '../data.js';
import { clubStatus, membersOf, requestFor, teensOf } from '../api/selectors.js';
import { nextSessionDates } from '../api/dates.js';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const backFor = { teen: '#/clubs', guardian: '#/clubs', mentor: '#/dashboard' };

function TeenAction({ club, db, teen, api }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const status = clubStatus(db, teen.id, club.id);
  const request = requestFor(db, teen.id, club.id);
  const blocked = teen.paused
    ? 'Your guardian paused your account, so you can’t ask to join clubs right now.'
    : !teen.consent.clubs
      ? 'Your guardian has not turned on club requests.'
      : null;

  const run = async (promise) => {
    setBusy(true);
    setError(await attempt(promise));
    setBusy(false);
  };

  if (status === 'member') return <Status>You're in. {club.confirmer} confirms each session you go to.</Status>;
  if (status === 'pending') {
    return (
      <div className="stack-2">
        <Status icon="clock">Request sent. You can join once your guardian approves.</Status>
        <button type="button" className="link-btn" disabled={busy} onClick={() => run(api.cancelRequest(request.id))}>
          Cancel request
        </button>
        <FieldError>{error}</FieldError>
      </div>
    );
  }
  return (
    <div className="stack-8">
      {status === 'declined' && <p className="small muted">Your guardian said not now. You can ask again if things have changed.</p>}
      <button type="button" className="btn btn-primary" disabled={!!blocked || busy} onClick={() => run(api.requestClub(club.id))}>
        {status === 'declined' ? 'Ask again' : 'Ask my guardian to approve'}
      </button>
      {blocked && <p className="small muted">{blocked}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export default function ClubDetail({ club }) {
  const { db, user, api } = useBackend();
  const leader = db.mentors[club.mentorId];
  const friends = clubFriends[club.id] || [];
  const spots = club.spots;
  const family = user.role === 'guardian' ? membersOf(db, club.id).filter((t) => teensOf(db, user.id).some((k) => k.id === t.id)) : [];

  return (
    <div className="detail">
      <main className="page">
        <NavBar title={club.type} back={backFor[user.role]} />
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
            Verified
          </span>
          <h2 className="h1 h1-detail">{club.name}</h2>
          <p className="row-meta">
            {club.when} · {club.ages}
          </p>
          {family.length > 0 ? (
            <span className="tag tag-green tag-inline">
              {family.map((t) => t.name).join(' & ')} already {family.length > 1 ? 'go' : 'goes'} here
            </span>
          ) : (
            user.role === 'teen' &&
            friends.length > 0 && (
              <span className="tag tag-keen tag-inline">
                <HeartFill size={12} />
                {friends.join(' & ')} {friends.length > 1 ? 'go' : 'goes'} here
              </span>
            )
          )}
        </div>

        <p className="body">{club.about}</p>

        {leader && (
          <a className="confirmer" href={`#/mentor/${leader.id}`} aria-label={`${leader.name}'s profile`}>
            <MentorAvatar size="md" person={leader} />
            <span className="stack-2 grow">
              <span className="row-title">{leader.name}</span>
              <span className="row-meta">{club.lead.split(' · ')[0]} · confirms every session</span>
            </span>
            <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
          </a>
        )}

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

        {club.cost && (
          <section className="cost" aria-label="Cost">
            <span className="cost-price">{club.cost.price}</span>
            <span className="row-meta">{club.cost.note}</span>
          </section>
        )}
      </main>

      <section className="sheet-panel" aria-label="Upcoming sessions">
        <h3 className="section-title">Upcoming sessions</h3>
        {nextSessionDates(club.day, 2).map((d, i) => (
          <div className="session" key={d.toDateString()}>
            <span className={i === 0 ? 'date-chip is-next' : 'date-chip'}>
              <span>{weekdays[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
            </span>
            <div className="stack-2">
              <span className="row-title">{club.session}</span>
              <span className="row-meta">
                {club.time} · {club.confirmer} confirms attendance
              </span>
            </div>
          </div>
        ))}
        {user.role === 'teen' && (
          <>
            <TeenAction club={club} db={db} teen={user} api={api} />
            <p className="fine">Your guardian gets the request in the app and on WhatsApp.</p>
          </>
        )}
        {user.role === 'guardian' && (
          <p className="fine fine-left">Teens ask to join from their own account. You approve each request in Family.</p>
        )}
      </section>
    </div>
  );
}
