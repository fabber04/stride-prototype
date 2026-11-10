import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import { mentor as matchedMentor } from '../data.js';

export default function MentorProfile({ person = matchedMentor }) {
  const [failed, setFailed] = useState(false);
  const mentor = person;

  return (
    <main className="page">
      <NavBar title="Mentor profile" back="#/mentor" />

      <section className="mentor-hero" aria-label={mentor.name}>
        {!failed ? (
          <img className="mentor-photo" src={mentor.photo} alt={mentor.name} onError={() => setFailed(true)} />
        ) : (
          <span className="mentor-photo mentor-photo-empty" aria-hidden="true">
            {mentor.initials}
          </span>
        )}
        <span className="mentor-badge">
          <Icon name="shield" size={14} strokeWidth={2.4} />
          {mentor.badge}
        </span>
      </section>

      <div className="stack-6 center">
        <h1 className="h1 h1-profile name-verified">
          {mentor.name}
          <span className="verified-tick" aria-label="Verified">
            <Icon name="check" size={13} strokeWidth={3.4} />
          </span>
        </h1>
        <span className="row-meta">
          {mentor.role} · {mentor.since}
        </span>
      </div>

      <div className="mentor-stats">
        {mentor.stats.map((s) => (
          <div key={s.label}>
            <strong className={s.value.length > 3 ? 'num stat-word' : 'num'}>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <section className="card card-pad" aria-label="About">
        <h2 className="section-title">About {mentor.first}</h2>
        {mentor.bio.map((p) => (
          <p className="body" key={p}>
            {p}
          </p>
        ))}
        <div className="teaches">
          {mentor.teaches.map((t) => (
            <span className="tag tag-blue" key={t}>
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="parent-note" aria-label="A note for parents">
        <span className="parent-note-label">A note for parents</span>
        <p>“{mentor.parentNote}”</p>
        <span className="parent-note-by">{mentor.name}</span>
      </section>

      <section className="panel" aria-label="Checked before joining Stride">
        <div className="panel-head">
          <h2 className="section-title">Checked before joining Stride</h2>
          <Icon name="shield" size={18} strokeWidth={1.8} color="var(--accent)" />
        </div>
        <ul className="checks">
          {mentor.checks.map((item) => (
            <li key={item}>
              <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="callout">
        <Icon name="eye" size={20} strokeWidth={1.6} />
        <p>Every message with {mentor.first} stays inside Stride, and guardians can read all of them.</p>
      </div>

      {mentor.id === matchedMentor.id ? (
        <a className="btn btn-primary" href="#/mentor">
          <Icon name="message" size={18} strokeWidth={1.8} />
          Message {mentor.first}
        </a>
      ) : (
        <a className="btn btn-primary" href={`#/ask/${mentor.id}`}>
          <Icon name="message" size={18} strokeWidth={1.8} />
          Message {mentor.first}
        </a>
      )}
    </main>
  );
}
