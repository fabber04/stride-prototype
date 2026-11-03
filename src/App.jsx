import { useEffect, useState } from 'react';
import { StoreProvider } from './store.jsx';
import TabBar from './components/TabBar.jsx';
import Today from './screens/Today.jsx';
import Clubs from './screens/Clubs.jsx';
import Learn from './screens/Learn.jsx';
import Mentor from './screens/Mentor.jsx';
import Guardian from './screens/Guardian.jsx';

const screens = { today: Today, clubs: Clubs, learn: Learn, mentor: Mentor, guardian: Guardian };

// Hash routing (#/clubs) keeps the app working on any static host, offline included.
function currentRoute() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return screens[id] ? id : 'today';
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

  const Screen = screens[route];

  return (
    <StoreProvider>
      <div className="app">
        <Screen />
        {route !== 'guardian' && <TabBar active={route} />}
      </div>
    </StoreProvider>
  );
}
