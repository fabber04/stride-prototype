import { Icon, HeartFill } from '../icons.jsx';
import Cover from './Cover.jsx';
import { clubCost, clubFriends, clubSpots } from '../data.js';

// Photo-led card for the Discover feed: artwork with status pills, then the details.
export default function ClubCard({ club, requested }) {
  const friends = clubFriends[club.id] || [];
  const spots = clubSpots[club.id];
  const cost = clubCost[club.id];

  return (
    <a className="club-card" href={`#/club/${club.id}`}>
      <Cover type={club.type} size="lg" photo={club.id}>
        <span className="over over-left">
          {spots && <span className="tag tag-warn">{spots === 1 ? '1 place left' : `${spots} places left`}</span>}
          <span className="tag tag-dark">Ages {club.range}</span>
        </span>
      </Cover>
      <span className="club-card-body">
        <span className="tag tag-blue">
          <Icon name="shield" size={12} strokeWidth={2.4} />
          Verified
        </span>
        <span className="club-card-title">{club.name}</span>
        <span className="row-meta">{club.lead.replace(' · ', ' ')}</span>
        <span className="club-card-note">{club.about}</span>
        <span className="meta-row">
          <span>
            <Icon name="calendar" size={14} strokeWidth={1.8} /> {club.when.split(',')[0]}
          </span>
          <span>
            <Icon name="clock" size={14} strokeWidth={1.8} /> {club.time}
          </span>
        </span>
        <span className="club-card-foot">
          <span className="price">{cost.price}</span>
          {requested ? (
            <span className="tag tag-green">Asked your guardian</span>
          ) : (
            friends.length > 0 && (
              <span className="tag tag-keen">
                <HeartFill size={12} />
                {friends.join(' & ')} {friends.length > 1 ? 'go' : 'goes'}
              </span>
            )
          )}
        </span>
      </span>
    </a>
  );
}
