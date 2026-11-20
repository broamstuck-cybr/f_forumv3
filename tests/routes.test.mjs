import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRouteFromPathname, routeToPathname } from '../src/utils/routes.ts';

test('canonical app routes agree with public landing links and round-trip', () => {
  assert.equal(routeToPathname('home'), '/app');
  assert.equal(routeToPathname('workspace'), '/work');
  for (const route of ['landing', 'home', 'workspace', 'explore', 'community', 'profile', 'settings', 'admin', 'not-found']) {
    assert.equal(parseRouteFromPathname(routeToPathname(route)), route);
  }
});

test('legacy deep links remain valid, unknown routes recover to a real 404 view', () => {
  assert.equal(parseRouteFromPathname('/home/'), 'home');
  assert.equal(parseRouteFromPathname('/workspace'), 'workspace');
  assert.equal(parseRouteFromPathname('/', '?view=workspace'), 'workspace');
  assert.equal(parseRouteFromPathname('/', '?view=constructor'), 'landing');
  assert.equal(parseRouteFromPathname('/unknown', '?view=home'), 'not-found');
});
