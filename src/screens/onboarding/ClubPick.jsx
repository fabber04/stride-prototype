import { useState } from 'react';
import StepHeader from '../../components/StepHeader.jsx';
import Status from '../../components/Status.jsx';
import { useStore } from '../../store.jsx';
import { explain } from '../../api.js';
import { clubs } from '../../data.js';

export default function ClubPick({ back }) {
  const { openClub } = useStore();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = async (clubId) => {
    setNotice('');
    setBusy(true);
    try {
      await openClub(clubId);
    } catch (error) {
      setNotice(explain(error));
      setBusy(false);
    }
  };

  return (
    <main className="page onboard">
      <StepHeader onBack={back} title="Which club is yours?">
        The first phone to claim a club becomes its owner. After that, staff join with a code.
      </StepHeader>
      {notice && <Status icon="lock">{notice}</Status>}
      <div className="stack-8">
        {clubs.map((club) => (
          <button type="button" className="option option-rich" key={club.id} disabled={busy} onClick={() => choose(club.id)}>
            <span className="row-title">{club.name}</span>
            <span className="row-meta">{club.when}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
