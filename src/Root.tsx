import { useEffect, useState } from 'react';
import App from './App';
import { HowToPage } from '@ui/pages';

type Route = 'howto' | 'app';

function getRouteFromHash(): Route {
  const h = window.location.hash;
  if (h === '#app') return 'app';
  // Treat empty/hash-only/hash-howto as the intro page.
  if (h === '' || h === '#' || h === '#howto') return 'howto';
  return 'howto';
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
        // Update UI immediately (some environments can delay hashchange-driven re-render).
        setRoute('app');
        window.location.hash = '#app';
      }}
    />
  );
}


