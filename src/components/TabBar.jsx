import { Icon } from '../icons.jsx';

export const roleTabs = {
  teen: [
    { id: 'today', label: 'Today', icon: 'home' },
    { id: 'clubs', label: 'Discover', icon: 'sparkles' },
    { id: 'learn', label: 'Learn', icon: 'bookOpen' },
    { id: 'mentor', label: 'Mentor', icon: 'message' }
  ],
  guardian: [
    { id: 'guardian', label: 'Family', icon: 'shield' },
    { id: 'clubs', label: 'Clubs', icon: 'sparkles' },
    { id: 'messages', label: 'Messages', icon: 'message' },
    { id: 'account', label: 'Account', icon: 'sliders' }
  ],
  mentor: [
    { id: 'dashboard', label: 'Today', icon: 'home' },
    { id: 'teens', label: 'Teens', icon: 'clubs' },
    { id: 'inbox', label: 'Messages', icon: 'message' },
    { id: 'lessons', label: 'Lessons', icon: 'bookOpen' }
  ]
};

// `badges` maps a tab id to true when it has something new (unread messages, tasks to confirm).
export default function TabBar({ role, active, badges = {} }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {roleTabs[role].map((tab) => {
        const on = tab.id === active;
        return (
          <a
            key={tab.id}
            href={`#/${tab.id}`}
            className={on ? 'tab is-active' : 'tab'}
            aria-current={on ? 'page' : undefined}
          >
            <span className={badges[tab.id] ? 'tab-icon has-dot' : 'tab-icon'}>
              <Icon name={tab.icon} size={22} strokeWidth={on ? 2.2 : 1.8} />
            </span>
            <span className="tab-label">
              {tab.label}
              {badges[tab.id] && <span className="visually-hidden"> (new)</span>}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
