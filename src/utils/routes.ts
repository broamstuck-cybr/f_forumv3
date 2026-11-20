import type { AppRoute } from '../types';

const paths = {
  landing: '/', home: '/app', explore: '/explore', workspace: '/work', community: '/community',
  profile: '/profile', settings: '/settings', admin: '/admin', 'not-found': '/404',
} satisfies Record<AppRoute, string>;

export function routeToPathname(route: AppRoute): string {
  return paths[route];
}

export function parseRouteFromPathname(pathname: string, search = ''): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/home') return 'home';
  if (clean === '/workspace') return 'workspace';
  if (clean === '/') {
    const view = new URLSearchParams(search).get('view');
    if (view && view !== 'not-found' && Object.hasOwn(paths, view)) return view as AppRoute;
  }
  return (Object.keys(paths) as AppRoute[]).find((route) => paths[route] === clean) ?? 'not-found';
}
