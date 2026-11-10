import { Icon, HeartFill } from '../icons.jsx';
import Cover from './Cover.jsx';
import { clubFriends } from '../data.js';

const statusTag = {
  member: <span className="tag tag-green">You're in</span>,
  pending: <span className="tag tag-green">Asked your guardian</span>,
  declined: <span className="tag tag-warn-soft">Not now</span>
};

// Photo-led card for the Discover feed. `status` is the teen's: member, pending, declined or null.
export default function ClubCard({ club, status, goers }) {
  const friends = goers || clubFriends[club.id] || [];
  const spots = club.spots;

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
          <span className="price">{club.cost?.price}</span>
          {statusTag[status] ||
            (friends.length > 0 && (
              <span className="tag tag-keen">
                <HeartFill size={12} />
                {friends.join(' & ')} {friends.length > 1 ? 'go' : 'goes'}
              </span>
            ))}
        </span>
      </span>
    </a>
  );
}
