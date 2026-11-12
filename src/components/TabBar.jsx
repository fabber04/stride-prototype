import { Icon } from '../icons.jsx';
import { useStore } from '../store.jsx';

const tabs = [
  { id: 'today', label: 'Today', icon: 'home' },
  { id: 'clubs', label: 'Discover', icon: 'sparkles' },
  { id: 'learn', label: 'Learn', icon: 'bookOpen' },
  { id: 'mentor', label: 'Mentor', icon: 'message' },
  { id: 'guardian', label: 'Guardian', icon: 'shield' }
];

export default function TabBar({ active }) {
  const { session } = useStore();
  const hidden = session?.role === 'teen' ? ['guardian'] : [];
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.filter((tab) => !hidden.includes(tab.id)).map((tab) => {
        const on = tab.id === active;
        return (
          <a
            key={tab.id}
            href={`#/${tab.id}`}
            className={on ? 'tab is-active' : 'tab'}
            aria-current={on ? 'page' : undefined}
          >
            <Icon name={tab.icon} size={22} strokeWidth={on ? 2.2 : 1.8} />
            <span className="tab-label">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
