import { useRef, useState } from 'react';
import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import { useStore } from '../store.jsx';
import { clubFriends, clubs, myClubs } from '../data.js';

const THRESHOLD = 90;

// Teen-facing swipe deck. A heart only asks the guardian; nothing is booked from here.
export default function Swipe() {
  const { state, set } = useStore();
  const [dx, setDx] = useState(0);
  const start = useRef(null);

  const deck = clubs.filter((c) => !myClubs.includes(c.id));
  const queue = deck.filter((c) => !state.requested[c.id] && !state.skipped[c.id]);
  const club = queue[0];
  const asked = deck.filter((c) => state.requested[c.id]).length;
  const seen = deck.length - queue.length;

  const decide = (like) => {
    set((prev) =>
      like
        ? { requested: { ...prev.requested, [club.id]: true } }
        : { skipped: { ...prev.skipped, [club.id]: true } }
    );
    setDx(0);
  };

  const onPointerDown = (e) => {
    start.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (start.current !== null) setDx(e.clientX - start.current);
  };
  const onPointerUp = () => {
    start.current = null;
    if (dx > THRESHOLD) decide(true);
    else if (dx < -THRESHOLD) decide(false);
    else setDx(0);
  };

  const friends = club ? clubFriends[club.id] || [] : [];

  return (
    <div className="swipe">
      <header className="swipe-head">
        <a className="round-btn" href="#/clubs" aria-label="Close">
          <Icon name="x" size={20} strokeWidth={2} />
        </a>
        <span className="swipe-who">
          <span className="swipe-avatar" aria-hidden="true">T</span>
          Tino
        </span>
        <span className="swipe-count" aria-label={`${asked} clubs asked about`}>
          <HeartFill size={16} /> {asked}
        </span>
      </header>
      <div className="swipe-progress" aria-hidden="true">
        <span style={{ width: `${(seen / deck.length) * 100}%` }} />
      </div>

      {club ? (
        <>
          <article
            key={club.id}
            className="swipe-card"
            style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label={club.name}
          >
            <Cover type={club.type} size="lg" photo={club.id} />
            {dx > 30 && <span className="stamp stamp-yes">Ask</span>}
            {dx < -30 && <span className="stamp stamp-no">Skip</span>}
            <div className="swipe-body">
              <h1 className="swipe-title">{club.name}</h1>
              <p className="row-meta">
                {club.when} · Ages {club.range}
              </p>
              <p className="body-muted clamp-2">{club.about}</p>
              {friends.length > 0 && (
                <p className="keen-line">
                  <HeartFill size={14} /> {friends.join(' & ')} {friends.length > 1 ? 'go' : 'goes'} here
                </p>
              )}
            </div>
          </article>
          <span className="swipe-hint" aria-hidden="true">← swipe →</span>
          <div className="swipe-actions">
            <button type="button" className="swipe-btn" aria-label={`Skip ${club.name}`} onClick={() => decide(false)}>
              <Icon name="thumbsDown" size={26} strokeWidth={1.8} />
            </button>
            <button type="button" className="swipe-btn swipe-btn-yes" aria-label={`Ask my guardian about ${club.name}`} onClick={() => decide(true)}>
              <HeartFill size={28} />
            </button>
          </div>
          <p className="swipe-note">No booking. A heart asks your guardian.</p>
        </>
      ) : (
        <div className="swipe-done">
          <h1 className="swipe-title">That's every club for now</h1>
          <p className="body-muted">
            You asked about {asked} {asked === 1 ? 'club' : 'clubs'}. Your guardian gets each request in the app and on WhatsApp.
          </p>
          <a className="btn btn-primary" href="#/clubs">
            Back to Discover
          </a>
          {seen > asked && (
            <button type="button" className="link-btn" onClick={() => set({ skipped: {} })}>
              See the ones I skipped again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
