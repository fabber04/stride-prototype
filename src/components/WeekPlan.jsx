import { Icon } from '../icons.jsx';
import { categoryIcon, weekDays } from '../data.js';
import { clubIdsOf, requestsFor } from '../api/selectors.js';

const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tileLabel = {
  football: 'Football', coders: 'Coders', robotics: 'Robotics', vocational: 'Skills',
  chess: 'Chess', choir: 'Choir', netball: 'Netball'
};

// A teen's week: their clubs, then clubs waiting for approval, then family routine.
function weekFor(db, teen) {
  const plan = {};
  for (const id of clubIdsOf(db, teen.id)) {
    const club = db.clubs[id];
    if (club) plan[dayName[club.day]] ||= { club };
  }
  for (const r of requestsFor(db, teen.id)) {
    const club = db.clubs[r.clubId];
    if (r.status === 'pending' && club) plan[dayName[club.day]] ||= { club, pending: true };
  }
  for (const [day, slot] of Object.entries(teen.routine || {})) plan[day] ||= slot;
  return plan;
}

// One row per teen, one tile per day. Empty days are the unsupervised gaps worth filling.
export default function WeekPlan({ db, teens }) {
  const weeks = teens.map((teen) => ({ teen, plan: weekFor(db, teen) }));
  const open = weeks.reduce((n, { plan }) => n + weekDays.filter((d) => !plan[d]).length, 0);

  return (
    <section className="plan" aria-label="Week plan">
      <div className="plan-grid">
        <span />
        {weekDays.map((d) => (
          <span key={d} className="plan-day">
            {d}
          </span>
        ))}
        {weeks.map(({ teen, plan }) => (
          <div className="plan-row" key={teen.id}>
            <span className="plan-kid" style={{ color: teen.color }}>
              {teen.name}
            </span>
            {weekDays.map((d) => {
              const slot = plan[d];
              if (!slot) {
                return (
                  <a key={d} className="plan-tile is-open" href="#/clubs" aria-label={`${teen.name} has nothing on ${d}. Find a club`}>
                    <Icon name="plus" size={14} strokeWidth={2} />
                  </a>
                );
              }
              const club = slot.club;
              const label = club ? tileLabel[club.id] || club.name.split(' ')[0] : slot.label;
              const icon = club ? categoryIcon[club.type] : slot.icon;
              return (
                <span
                  key={d}
                  className={slot.pending ? 'plan-tile is-pending' : club ? 'plan-tile is-club' : 'plan-tile'}
                  title={`${teen.name}, ${d}: ${club ? club.name : slot.label}${slot.pending ? ' (waiting for you)' : ''}`}
                >
                  <Icon name={icon} size={14} strokeWidth={1.8} />
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="plan-foot">
        <strong>{open} {open === 1 ? 'day' : 'days'} still open</strong> · tap a gap to find a club
      </p>
    </section>
  );
}
