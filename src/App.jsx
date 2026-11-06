import { useEffect, useState } from 'react';
import { StoreProvider } from './store.jsx';
import TabBar from './components/TabBar.jsx';
import Today from './screens/Today.jsx';
import Clubs from './screens/Clubs.jsx';
import ClubDetail from './screens/ClubDetail.jsx';
import Learn from './screens/Learn.jsx';
import Lesson from './screens/Lesson.jsx';
import Mentor from './screens/Mentor.jsx';
import Guardian from './screens/Guardian.jsx';
import { clubById, lessonById } from './data.js';

const tabs = { today: Today, clubs: Clubs, learn: Learn, mentor: Mentor, guardian: Guardian };

// Hash routing (#/clubs, #/club/football) keeps the app working on any static host, offline included.
function currentRoute() {
  const [name, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (name === 'club' && clubById[id]) return { name, id };
  if (name === 'lesson' && lessonById[id]) return { name, id };
  return { name: tabs[name] ? name : 'today' };
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  let screen;
  if (route.name === 'club') screen = <ClubDetail club={clubById[route.id]} />;
  else if (route.name === 'lesson') screen = <Lesson lesson={lessonById[route.id]} />;
  else {
    const Tab = tabs[route.name];
    screen = <Tab />;
  }

  return (
    <StoreProvider>
      <div className="app">
        {screen}
        {tabs[route.name] && <TabBar active={route.name} />}
      </div>
    </StoreProvider>
  );
}
