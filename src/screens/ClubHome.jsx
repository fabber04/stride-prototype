import { useState } from 'react';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { explain } from '../api.js';
import { mentors } from '../data.js';
import { formatWhen } from '../onboarding.js';

function money(cents, currency) {
  return `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function ClubHome() {
  const { org, session, acceptMember, confirmMember, mintStaff, leaveFamily } = useStore();
  const [notice, setNotice] = useState('');
  const [code, setCode] = useState(null);
  const listed = org?.listingStatus === 'listed';

  const run = async (action) => {
    setNotice('');
    try {
      const result = await action();
      if (result?.invite) setCode(result.invite);
    } catch (error) {
      setNotice(explain(error));
    }
  };

  if (!org) {
    return (
      <main className="page">
        <h1 className="h1">Club</h1>
        <p className="row-meta">Loading the roster…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">{org.name}</h1>
        <p className="row-meta">
          {session?.role === 'owner' ? 'Club owner' : 'Club leader'} · {listed ? 'Listed' : 'Suspended'} · {money(org.sessionFeeCents, org.currency)} a confirmed session
        </p>
      </header>
      <Status>
        Accrued {money(org.accruedCents, org.currency)}. Nothing has been charged.
      </Status>
      {notice && <Status icon="lock">{notice}</Status>}
      {!listed && <Status icon="lock">This listing is suspended, so new accepts and confirmations wait.</Status>}

      <h2 className="section-title">Roster</h2>
      {org.roster.length === 0 && <p className="row-meta">No guardian-approved teens yet.</p>}
      {org.roster.map((teen) => (
        <section className="panel stack-8" key={teen.familyId}>
          <span className="row-title">{teen.name}</span>
          <span className="row-meta">
            {teen.ageBand} · {teen.status === 'accepted' ? 'Accepted' : 'Waiting for the club'} · {teen.confirmed} confirmed
          </span>
          {teen.status === 'waiting' && (
            <button type="button" className="btn btn-primary" disabled={!listed} onClick={() => run(() => acceptMember(teen.familyId))}>
              Accept {teen.name}
            </button>
          )}
          {teen.status === 'accepted' && (
            <button type="button" className="btn btn-primary" disabled={!listed || teen.confirmedToday} onClick={() => run(() => confirmMember(teen.familyId))}>
              {teen.confirmedToday ? 'Today is already confirmed' : 'Confirm today’s session'}
            </button>
          )}
        </section>
      ))}

      {session?.role === 'owner' && (
        <>
          <h2 className="section-title">Staff codes</h2>
          <p className="row-meta">A code works once, for 24 hours. A leader can accept and confirm. A mentor only sees allowed messages.</p>
          <button type="button" className="btn btn-ghost" onClick={() => run(() => mintStaff('leader'))}>
            Code for a leader
          </button>
          {org.mentors.length > 0 && <p className="row-meta">Mentors at this club: {org.mentors.map((person) => person.name).join(', ')}</p>}
          {mentors.map((person) => (
            <button type="button" className="btn btn-ghost" key={person.id} onClick={() => run(() => mintStaff('mentor', person.id))}>
              Code for {person.first}
            </button>
          ))}
          {code && (
            <section className="panel stack-8" aria-label="Staff code">
              <p className="body">
                {code.role === 'mentor' ? 'Mentor' : 'Leader'} code. It works once, before {formatWhen(code.expiresAt)}.
              </p>
              <p className="family-code">{code.code}</p>
            </section>
          )}
        </>
      )}

      <button type="button" className="link-btn" onClick={leaveFamily}>
        Leave this club phone
      </button>
    </main>
  );
}
