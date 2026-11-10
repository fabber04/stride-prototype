import { useEffect, useState } from 'react';
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

function Screens() {
  const { state } = useStore();
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    );
  }

  let screen;
  if (route.name === 'club') screen = <ClubDetail club={clubById[route.id]} />;
  else if (route.name === 'lesson') screen = <Lesson lesson={lessonById[route.id]} />;
  else if (route.name === 'swipe') screen = <Swipe />;
  else if (route.name === 'mentorProfile') screen = <MentorProfile key={route.id} person={mentorById[route.id]} />;
  else if (route.name === 'guardianControls') screen = <GuardianControls />;
  else {
    const Tab = tabs[route.name];
    screen = <Tab composeId={route.compose} />;
  }

  return (
    <div className="app">
      {screen}
      {tabs[route.name] && <TabBar active={route.name} />}
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
