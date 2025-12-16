import { useEffect, useState } from 'react';
import App from './App';
import { HowToPage } from '@ui/pages';

type Route = 'howto' | 'app';

function getRouteFromHash(): Route {
  return window.location.hash === '#app' ? 'app' : 'howto';
}

export default function Root() {
  const [route, setRoute] = useState<Route>(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'app') return <App />;

  return (
    <HowToPage
      onLaunchApp={() => {
        window.location.hash = '#app';
      }}
    />
  );
}


