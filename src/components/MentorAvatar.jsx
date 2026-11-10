import { useState } from 'react';

// A mentor's photo, or their initials if there is no photo or it fails to load.
export default function MentorAvatar({ size = 'md', className = '', person }) {
  const [failed, setFailed] = useState(false);
  if (!person) return null;
  const initials = person.initials || person.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`avatar avatar-${size} ${className}`} aria-hidden="true">
      {person.avatar && !failed ? (
        <img className="avatar-img" src={person.avatar} alt="" onError={() => setFailed(true)} draggable="false" />
      ) : (
        initials
      )}
    </span>
  );
}
