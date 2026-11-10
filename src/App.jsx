import { useEffect, useState } from 'react';
import { BackendProvider, useBackend } from './api/index.jsx';
import { StoreProvider, useStore } from './store.jsx';
import { tasksToReview, unreadCount } from './api/selectors.js';
import TabBar, { roleTabs } from './components/TabBar.jsx';
import Today from './screens/Today.jsx';
import Clubs from './screens/Clubs.jsx';
import ClubDetail from './screens/ClubDetail.jsx';
import Learn from './screens/Learn.jsx';
import Lesson from './screens/Lesson.jsx';
import Mentor from './screens/Mentor.jsx';
import Chat from './screens/Chat.jsx';
import Account from './screens/Account.jsx';
import Guardian from './screens/Guardian.jsx';
import GuardianControls from './screens/GuardianControls.jsx';
import GuardianMessages from './screens/GuardianMessages.jsx';
import Swipe from './screens/Swipe.jsx';
import MentorProfile from './screens/MentorProfile.jsx';
import MentorHome from './screens/mentor/MentorHome.jsx';
import MentorTeens from './screens/mentor/MentorTeens.jsx';
import MentorInbox from './screens/mentor/MentorInbox.jsx';
import MentorLessons from './screens/mentor/MentorLessons.jsx';
import LessonEditor from './screens/mentor/LessonEditor.jsx';
import Onboarding from './screens/onboarding/Onboarding.jsx';
import NotFound from './screens/NotFound.jsx';
import { Icon } from './icons.jsx';

const tabScreens = {
  teen: { today: Today, clubs: Clubs, learn: Learn, mentor: Mentor },
  guardian: { guardian: Guardian, clubs: Clubs, messages: GuardianMessages, account: Account },
  mentor: { dashboard: MentorHome, teens: MentorTeens, inbox: MentorInbox, lessons: MentorLessons }
};
const homeOf = { teen: 'today', guardian: 'guardian', mentor: 'dashboard' };

const parseHash = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

// Hash routing (#/clubs, #/club/football) keeps the app working on any static host.
function resolve(parts, user, db) {
  const [name, a, b] = parts;
  const role = user.role;
  const tabs = tabScreens[role];
  if (!name) return { tab: homeOf[role] };
  if (tabs[name] && !a) return { tab: name };
  if (name === 'club') return db.clubs[a] ? { screen: <ClubDetail key={a} club={db.clubs[a]} /> } : null;
  if (name === 'lesson') return db.lessons[a] ? { screen: <Lesson key={a} lesson={db.lessons[a]} /> } : null;
  if (name === 'account') return { tab: role === 'guardian' ? 'account' : null, screen: <Account /> };
  if (name === 'mentor' && !a && role === 'mentor') {
    return { screen: <MentorProfile person={db.mentors[user.mentorId]} /> };
  }
  if (name === 'mentor' && a) return db.mentors[a] ? { screen: <MentorProfile key={a} person={db.mentors[a]} /> } : null;

  if (role === 'teen') {
    if (name === 'swipe') return { screen: <Swipe /> };
    if ((name === 'chat' || name === 'ask') && db.mentors[a]) return { screen: <Chat key={a} teenId={user.id} mentorId={a} /> };
  }
  if (role === 'guardian') {
    if (name === 'guardian' && a === 'controls') return { screen: <GuardianControls /> };
    if (name === 'chat' && db.users[a] && db.mentors[b]) return { screen: <Chat key={a + b} teenId={a} mentorId={b} readOnly /> };
  }
  if (role === 'mentor') {
    if (name === 'lessons' && a === 'new') return { screen: <LessonEditor key="new" /> };
    if (name === 'lessons' && b === 'edit' && db.lessons[a]) return { screen: <LessonEditor key={a} lesson={db.lessons[a]} /> };
    if (name === 'chat' && db.users[a]) return { screen: <Chat key={a} teenId={a} mentorId={user.mentorId} /> };
  }
  return null;
}

function Loading({ error, onRetry }) {
  return (
    <div className="app">
      <main className="page loading-page" aria-busy={!error}>
        {error ? (
          <>
            <p className="body">{error}</p>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Try again
            </button>
          </>
        ) : (
          <span className="spinner" aria-label="Loading" />
        )}
      </main>
    </div>
  );
}

function Screens() {
  const { db, user, ready, error, api } = useBackend();
  const { state } = useStore();
  const [parts, setParts] = useState(parseHash);

  useEffect(() => {
    const onChange = () => {
      setParts(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (!ready || !db) return <Loading error={error} onRetry={() => api.refresh()} />;

  if (!user || state.setup) {
    return (
      <div className="app">
        <Onboarding mode={state.setup?.mode} />
      </div>
    );
  }

  const route = resolve(parts, user, db);
  let screen;
  let tab = null;
  if (!route) screen = <NotFound home={homeOf[user.role]} />;
  else if (route.screen) {
    screen = route.screen;
    tab = route.tab || null;
  } else {
    const Tab = tabScreens[user.role][route.tab];
    screen = <Tab />;
    tab = route.tab;
  }

  const badges = {};
  if (user.role === 'teen') badges.mentor = unreadCount(db, { teenId: user.id }, 'teen') > 0;
  if (user.role === 'mentor') {
    badges.inbox = unreadCount(db, { mentorId: user.mentorId }, 'mentor') > 0;
    badges.dashboard = tasksToReview(db, user.mentorId).length > 0;
  }

  return (
    <div className="app">
      {user.role === 'teen' && user.paused && (
        <div className="paused-bar" role="status">
          <Icon name="lock" size={15} strokeWidth={2.2} />
          Your guardian paused your account for now. You can still look around.
        </div>
      )}
      {screen}
      {tab && roleTabs[user.role].some((t) => t.id === tab) && <TabBar role={user.role} active={tab} badges={badges} />}
    </div>
  );
}

export default function App() {
  return (
    <BackendProvider>
      <StoreProvider>
        <Screens />
      </StoreProvider>
    </BackendProvider>
  );
}
