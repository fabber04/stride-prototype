import { useRef, useState } from 'react';
import { Icon, HeartFill } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import FieldError from '../components/FieldError.jsx';
import { useStore } from '../store.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { clubFriends } from '../data.js';
import { allowed, clubList, clubStatus } from '../api/selectors.js';

const THRESHOLD = 90;

// Teen-facing swipe deck. A heart only asks the guardian; nothing is booked from here.
export default function Swipe() {
  const { state, set } = useStore();
  const { db, user: teen, api } = useBackend();
  const [dx, setDx] = useState(0);
  const [error, setError] = useState(null);
  const start = useRef(null);
  const canAsk = allowed(teen, 'clubs');

  const deck = clubList(db)
    .filter((c) => clubStatus(db, teen.id, c.id) !== 'member')
    .sort((a, b) => Number(teen.interests.includes(b.type)) - Number(teen.interests.includes(a.type)));
  const asked = deck.filter((c) => clubStatus(db, teen.id, c.id) === 'pending').length;
  const queue = deck.filter((c) => !clubStatus(db, teen.id, c.id) && !state.skipped[c.id]);
  const club = queue[0];
  const seen = deck.length - queue.length;

  const decide = async (like) => {
    setDx(0);
    if (!like) {
      set((prev) => ({ skipped: { ...prev.skipped, [club.id]: true } }));
      return;
    }
    setError(await attempt(api.requestClub(club.id)));
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
    if (dx > THRESHOLD && canAsk) decide(true);
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
          <span className="swipe-avatar" style={{ color: teen.color }} aria-hidden="true">
            {teen.nickname[0].toUpperCase()}
          </span>
          {teen.nickname}
        </span>
        <span className="swipe-count" aria-label={`${asked} clubs asked about`}>
          <HeartFill size={16} /> {asked}
        </span>
      </header>
      <div className="swipe-progress" aria-hidden="true">
        <span style={{ width: `${deck.length ? (seen / deck.length) * 100 : 100}%` }} />
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
            {dx > 30 && canAsk && <span className="stamp stamp-yes">Ask</span>}
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
            <button
              type="button"
              className="swipe-btn swipe-btn-yes"
              aria-label={`Ask my guardian about ${club.name}`}
              disabled={!canAsk}
              onClick={() => decide(true)}
            >
              <HeartFill size={28} />
            </button>
          </div>
          <FieldError>{error}</FieldError>
          <p className="swipe-note">
            {canAsk ? 'No booking. A heart asks your guardian.' : 'Club requests are off for now, so you can only look.'}
          </p>
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
          {Object.keys(state.skipped).length > 0 && (
            <button type="button" className="link-btn" onClick={() => set({ skipped: {} })}>
              See the ones I skipped again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
