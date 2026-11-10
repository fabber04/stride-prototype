import { Icon } from '../icons.jsx';
import { categoryIcon, childColor, children, clubById, weekDays, weekPlan } from '../data.js';

const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tileLabel = {
  football: 'Football', coders: 'Coders', robotics: 'Robotics', vocational: 'Skills',
  chess: 'Chess', choir: 'Choir', netball: 'Netball'
};

// Builds a child's week from their regular clubs plus any request made in the app.
function weekFor(childId, requested, decisions) {
  const plan = { ...weekPlan[childId] };
  if (childId === 'tino') {
    Object.keys(requested).forEach((id) => {
      if (!requested[id] || decisions[id] === 'declined') return;
      const day = dayName[clubById[id].day];
      if (!plan[day]) plan[day] = { club: id, pending: decisions[id] !== 'approved' };
    });
  }
  return plan;
}

// One row per child, one tile per day. Empty days are the unsupervised gaps worth filling.
export default function WeekPlan({ requested, decisions }) {
  const weeks = children.map((kid) => ({ kid, plan: weekFor(kid.id, requested, decisions) }));
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
        {weeks.map(({ kid, plan }) => (
          <div className="plan-row" key={kid.id}>
            <span className="plan-kid" style={{ color: childColor[kid.id] }}>
              {kid.label}
            </span>
            {weekDays.map((d) => {
              const slot = plan[d];
              if (!slot) {
                return (
                  <a key={d} className="plan-tile is-open" href="#/clubs" aria-label={`${kid.label} has nothing on ${d}. Find a club`}>
                    <Icon name="plus" size={14} strokeWidth={2} />
                  </a>
                );
              }
              const club = slot.club && clubById[slot.club];
              const label = club ? tileLabel[club.id] : slot.label;
              const icon = club ? categoryIcon[club.type] : slot.icon;
              return (
                <span
                  key={d}
                  className={slot.pending ? 'plan-tile is-pending' : club ? 'plan-tile is-club' : 'plan-tile'}
                  title={`${kid.label}, ${d}: ${club ? club.name : slot.label}${slot.pending ? ' (waiting for you)' : ''}`}
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
        <strong>{open} days still open</strong> · tap a gap to find a club
      </p>
    </section>
  );
}
