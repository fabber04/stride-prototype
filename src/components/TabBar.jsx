import { Icon } from '../icons.jsx';

const tabs = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'clubs', label: 'Clubs', icon: 'clubs' },
  { id: 'learn', label: 'Learn', icon: 'learn' },
  { id: 'mentor', label: 'Mentors', icon: 'mentors' }
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
            <span className="tab-icon">
              <Icon name={tab.icon} />
            </span>
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
