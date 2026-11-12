import { useEffect, useState } from 'react';
import TeenSetup from './screens/onboarding/TeenSetup.jsx';
import Leader from './screens/Leader.jsx';
import ClubHome from './screens/ClubHome.jsx';
import MentorHome from './screens/MentorHome.jsx';
import { StoreProvider, useStore } from './store.jsx';
import TabBar from './components/TabBar.jsx';
import Today from './screens/Today.jsx';
import Clubs from './screens/Clubs.jsx';
import ClubDetail from './screens/ClubDetail.jsx';
import Learn from './screens/Learn.jsx';
import Lesson from './screens/Lesson.jsx';
import Mentor from './screens/Mentor.jsx';
import Guardian from './screens/Guardian.jsx';
import GuardianControls from './screens/GuardianControls.jsx';
import Swipe from './screens/Swipe.jsx';
import MentorProfile from './screens/MentorProfile.jsx';
import Onboarding from './screens/onboarding/Onboarding.jsx';
import { clubById, lessonById, mentor, mentorById } from './data.js';

const tabs = { today: Today, clubs: Clubs, learn: Learn, mentor: Mentor, guardian: Guardian };

// Hash routing (#/clubs, #/club/football) keeps the app working on any static host, offline included.
function currentRoute() {
  const [name, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (name === 'club' && clubById[id]) return { name, id };
  if (name === 'lesson' && lessonById[id]) return { name, id };
  if (name === 'swipe') return { name };
  if (name === 'mentor' && id === 'profile') return { name: 'mentorProfile', id: mentor.id };
  if (name === 'mentor' && mentorById[id]) return { name: 'mentorProfile', id };
  if (name === 'ask' && mentorById[id]) return { name: 'mentor', compose: id };
  if (name === 'guardian' && id === 'controls') return { name: 'guardianControls' };
  return { name: tabs[name] ? name : 'today' };
}

function TeenFinish() {
  const { state, saveProfile } = useStore();
  const teen = state.account?.teen || {};
  const [draft, setDraft] = useState({
    teenName: teen.name || 'Teen',
    nickname: teen.nickname || teen.name || '',
    interests: teen.interests || [],
    goal: teen.goal || 3
  });
  const [problem, setProblem] = useState('');
  return (
    <TeenSetup
      draft={draft}
      update={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      problem={problem}
      onDone={async () => {
        try {
          await saveProfile({ nickname: draft.nickname, interests: draft.interests, goal: draft.goal });
          localStorage.setItem('stride-teen-setup', '1');
        } catch {
          setProblem('That could not be saved.');
        }
      }}
    />
  );
}

function Screens() {
  const { state, ready, session } = useStore();
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    if (session?.role === 'teen' && (route.name === 'guardian' || route.name === 'guardianControls')) {
      window.location.hash = '#/today';
    }
  }, [route, session]);

  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (!ready) {
    return <div className="app" />;
  }

  if (session?.scope === 'org') {
    return (
      <div className="app">
        {session.role === 'mentor' ? <MentorHome /> : <ClubHome />}
      </div>
    );
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    );
  }

  if (session?.role === 'leader') {
    return (
      <div className="app">
        <Leader />
      </div>
    );
  }

  const needsSetup =
    session?.role === 'teen' &&
    state.account &&
    !(state.account.teen?.interests || []).length &&
    !localStorage.getItem('stride-teen-setup');
  if (needsSetup) {
    return (
      <div className="app">
        <TeenFinish />
      </div>
    );
  }

  const teenBlocked = session?.role === 'teen' && (route.name === 'guardian' || route.name === 'guardianControls');
  const safeRoute = teenBlocked ? { name: 'today' } : route;

  let screen;
  if (safeRoute.name === 'club') screen = <ClubDetail club={clubById[safeRoute.id]} />;
  else if (safeRoute.name === 'lesson') screen = <Lesson lesson={lessonById[safeRoute.id]} />;
  else if (safeRoute.name === 'swipe') screen = <Swipe />;
  else if (safeRoute.name === 'mentorProfile') screen = <MentorProfile key={safeRoute.id} person={mentorById[safeRoute.id]} />;
  else if (safeRoute.name === 'guardianControls') screen = <GuardianControls />;
  else {
    const Tab = tabs[safeRoute.name];
    screen = <Tab composeId={safeRoute.compose} />;
  }

  const guardianView = safeRoute.name === 'guardian' || safeRoute.name === 'guardianControls';

  return (
    <div className="app">
      {state.paused && !guardianView && (
        <p className="pause-banner" role="status">
          Your guardian paused this account. Club requests and mentor messages wait until they turn it back on.
        </p>
      )}
      {screen}
      {tabs[safeRoute.name] && <TabBar active={safeRoute.name} />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  );
}
