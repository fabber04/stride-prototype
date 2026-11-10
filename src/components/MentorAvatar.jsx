import { useState } from 'react';
import { mentor } from '../data.js';

// The mentor's photo, or their initials if the photo is missing or fails to load.
export default function MentorAvatar({ size = 'md', className = '', person = mentor }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`avatar avatar-${size} ${className}`} aria-hidden="true">
      {!failed ? (
        <img className="avatar-img" src={person.avatar} alt="" onError={() => setFailed(true)} draggable="false" />
      ) : (
        person.initials
      )}
    </span>
  );
}
