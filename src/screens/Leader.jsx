import { useState } from 'react';
import { Icon } from '../icons.jsx';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { explain } from '../api.js';
import { clubById } from '../data.js';
import { teenProfile } from '../teen.js';

export default function Leader() {
  const { state, session, acceptClub, confirmSession, leaveFamily } = useStore();
  const [notice, setNotice] = useState('');
  const club = clubById[session?.clubId];
  const teen = teenProfile(state);
  const approved = state.decisions?.[club?.id] === 'approved';
  const accepted = state.coach?.[club?.id] === 'accepted';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: state.timezone || 'Africa/Johannesburg' }).format(new Date());
  const confirmedToday = (state.attendance || []).some(
    (row) => row.clubId === club?.id && new Intl.DateTimeFormat('en-CA', { timeZone: state.timezone || 'Africa/Johannesburg' }).format(new Date(row.at)) === today
  );

  const run = async (action) => {
    setNotice('');
    try {
      await action();
    } catch (error) {
      setNotice(explain(error));
    }
  };

  if (!club) {
    return (
      <main className="page">
        <h1 className="h1">Club leader</h1>
        <Status icon="lock">This code is not tied to a club.</Status>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">{club.name}</h1>
        <p className="row-meta">Leader code for {teen.name}. You can accept them and confirm a session. You cannot read their messages or reports.</p>
      </header>
      {notice && <Status icon="lock">{notice}</Status>}
      {!approved && <Status icon="lock">A guardian has not approved this club yet.</Status>}
      {approved && !accepted && (
        <button type="button" className="btn btn-primary" onClick={() => run(acceptClub)}>
          Accept {teen.name}
        </button>
      )}
      {accepted && (
        <button type="button" className="btn btn-primary" disabled={confirmedToday} onClick={() => run(confirmSession)}>
          <Icon name="check" size={18} strokeWidth={2} />
          {confirmedToday ? 'Today is already confirmed' : 'Confirm today’s session'}
        </button>
      )}
      <button type="button" className="link-btn" onClick={leaveFamily}>
        Leave this leader code
      </button>
    </main>
  );
}
