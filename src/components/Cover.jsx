import { Icon } from '../icons.jsx';
import { categoryIcon } from '../data.js';

const iconSize = { sm: 24, md: 40, lg: 56 };

// Artwork for a club or lesson. `photo` is a club id with a photo in public/clubs, `image` is any
// other photo path; without either it falls back to a tint coloured by category.
// `label` shows the category name instead of the icon.
export default function Cover({ type, size = 'md', label = false, photo, image, children }) {
  const src = image || (photo && `clubs/${photo}.webp`);
  return (
    <div className={`cover cover-${size}`} data-type={type}>
      {src ? (
        <img className="cover-img" src={src} alt="" loading="lazy" draggable="false" />
      ) : label ? (
        <span className="cover-label">{type}</span>
      ) : (
        <Icon name={categoryIcon[type] || 'grid'} size={iconSize[size]} strokeWidth={1.8} />
      )}
      {children}
    </div>
  );
}
