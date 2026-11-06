import { Icon } from '../icons.jsx';
import { categoryIcon } from '../data.js';

const iconSize = { sm: 24, md: 40, lg: 56 };

// Tinted artwork for a club or lesson, coloured by its category. Works offline, unlike photos.
// `label` shows the category name instead of the icon, as in the club list.
export default function Cover({ type, size = 'md', label = false, children }) {
  return (
    <div className={`cover cover-${size}`} data-type={type}>
      {label ? (
        <span className="cover-label">{type}</span>
      ) : (
        <Icon name={categoryIcon[type] || 'grid'} size={iconSize[size]} strokeWidth={1.8} />
      )}
      {children}
    </div>
  );
}
