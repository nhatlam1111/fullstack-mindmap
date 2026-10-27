import { useEffect, useState } from 'react';
import { topics } from './content';

export type Route =
  | { name: 'today' }
  | { name: 'map' }
  | { name: 'tree' }
  | { name: 'roadmap'; week?: number }
  | { name: 'review' }
  | { name: 'data' }
  | { name: 'topic'; id: string }
  | { name: 'notfound'; hash: string };

/** Hash chỉ dùng token đơn (chữ, số, dấu gạch) để link từ artifact mở thẳng được. */
export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#\/?/, ''));
  if (!h || h === 'today') return { name: 'today' };
  if (h === 'map') return { name: 'map' };
  if (h === 'tree') return { name: 'tree' };
  if (h === 'roadmap') return { name: 'roadmap' };
  if (h === 'review') return { name: 'review' };
  if (h === 'data') return { name: 'data' };
  const w = /^w(\d{1,2})$/.exec(h);
  if (w) return { name: 'roadmap', week: Number(w[1]) };
  if (topics[h]) return { name: 'topic', id: h };
  return { name: 'notfound', hash: h };
}

export function href(r: Route): string {
  switch (r.name) {
    case 'today': return '#today';
    case 'topic': return '#' + r.id;
    case 'roadmap': return r.week ? `#w${r.week}` : '#roadmap';
    case 'notfound': return '#today';
    default: return '#' + r.name;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(hashHref: string) {
  if (window.location.hash === hashHref) return;
  window.location.hash = hashHref;
}
