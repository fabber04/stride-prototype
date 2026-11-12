import { Icon } from '../icons.jsx';
import { categoryIcon, clubById, weekDays } from '../data.js';

const tileLabel = {
  football: 'Football', coders: 'Coders', robotics: 'Robotics', vocational: 'Skills',
  chess: 'Chess', choir: 'Choir', netball: 'Netball'
};

function slotsOf(slot) {
  if (!slot) return [];
  return Array.isArray(slot) ? slot : [slot];
}

function DayTiles({ label, day, slots }) {
  if (!slots.length) {
    return (
      <a className="plan-tile is-open" href="#/clubs" aria-label={`${label} has nothing on ${day}. Find a club`}>
        <Icon name="plus" size={14} strokeWidth={2} />
      </a>
    );
  }
  return (
    <span className={slots.length > 1 ? 'plan-stack' : 'plan-stack is-single'}>
      {slots.map((slot) => {
        const club = slot.club && clubById[slot.club];
        const tile = club ? tileLabel[club.id] : slot.label;
        const icon = club ? categoryIcon[club.type] : slot.icon;
        return (
          <span
            key={slot.club || slot.label}
            className={slot.pending ? 'plan-tile is-pending' : club ? 'plan-tile is-club' : 'plan-tile'}
            title={`${label}, ${day}: ${club ? club.name : slot.label}${slot.pending ? ' (waiting)' : ''}`}
          >
            <Icon name={icon} size={14} strokeWidth={1.8} />
            <span>{tile}</span>
          </span>
        );
      })}
    </span>
  );
}

// One row per child. A day can hold more than one club. Empty days are the gaps worth filling.
export default function WeekPlan({ rows }) {
  const open = rows.reduce((n, { plan }) => n + weekDays.filter((d) => slotsOf(plan[d]).length === 0).length, 0);

  return (
    <section className="plan" aria-label="Week plan">
      <div className="plan-grid">
        <span />
        {weekDays.map((d) => (
          <span key={d} className="plan-day">
            {d}
          </span>
        ))}
        {rows.map(({ id, label, color, plan }) => (
          <div className="plan-row" key={id}>
            <span className="plan-kid" style={{ color }}>
              {label}
            </span>
            {weekDays.map((d) => (
              <DayTiles key={d} label={label} day={d} slots={slotsOf(plan[d])} />
            ))}
          </div>
        ))}
      </div>
      <p className="plan-foot">
        <strong>{open} days still open</strong> · tap a gap to find a club
      </p>
    </section>
  );
}
