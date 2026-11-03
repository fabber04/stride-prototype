import { Icon } from '../icons.jsx';

// Confirmation line used after an action (check in, request sent, and so on).
export default function Status({ children, icon = 'checkCircle' }) {
  return (
    <div className="status" role="status">
      <Icon name={icon} size={20} strokeWidth={2.4} color="var(--success)" />
      <span>{children}</span>
    </div>
  );
}
