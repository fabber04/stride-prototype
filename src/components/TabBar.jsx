import { Icon } from '../icons.jsx';

const tabs = [
  { id: 'today', label: 'Today', icon: 'home' },
  { id: 'clubs', label: 'Clubs', icon: 'clubs' },
  { id: 'learn', label: 'Learn', icon: 'bookOpen' },
  { id: 'mentor', label: 'Mentor', icon: 'message' },
  { id: 'guardian', label: 'Guardian', icon: 'shield' }
];

export default function TabBar({ active }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <a
            key={tab.id}
            href={`#/${tab.id}`}
            className={on ? 'tab is-active' : 'tab'}
            aria-current={on ? 'page' : undefined}
          >
            <Icon name={tab.icon} size={24} strokeWidth={on ? 2.1 : 1.8} />
            <span className="tab-label">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
