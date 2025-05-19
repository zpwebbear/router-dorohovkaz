import { strictEqual, notStrictEqual, deepStrictEqual } from 'node:assert';
import { test, describe } from 'node:test';
import { Router } from '../src/index.js';

describe('Test Router Class', () => {
  test('Add and retrieve static route', () => {
    const router = new Router();
    const payload = { name: 'test' };
    const path = '/test';
    router.addRoute(path, payload);
    const route = router.getRoute(path);
    strictEqual(route.payload, payload);
  });

  test('Add and retrieve nested static route', () => {
    const router = new Router();
    const payload = { name: 'nested' };
    const path = '/test/nested';
    router.addRoute(path, payload);
    const route = router.getRoute(path);
    strictEqual(route.payload, payload);
  });

  test('Add and retrieve parameterized route', () => {
    const router = new Router();
    const payload = { name: 'param' };
    router.addRoute('/test/:id', payload);
    const route = router.getRoute('/test/123');
    strictEqual(route.payload, payload);
    strictEqual(route.keyParameters. get('id'), '123');
  });

  test('Add and retrieve route with multiple parameters', () => {
    const router = new Router();
    const payload = { name: 'multi-param' };
    router.addRoute('/test/:id/:name', payload);
    const route = router.getRoute('/test/123/john');
    strictEqual(route.payload, payload);
    strictEqual(route.keyParameters.get('id'), '123');
    strictEqual(route.keyParameters.get('name'), 'john');
  });

  test('Add and retrieve wildcard route', () => {
    const router = new Router();
    const payload = { name: 'wildcard' };
    router.addRoute('/test/*', payload);
    const route = router.getRoute('/test/anything/else');
    strictEqual(route.payload, payload);
  });

  test('Static route preferred over parameterized', () => {
    const router = new Router();
    const staticPayload = { name: 'settings' };
    const paramPayload = { name: 'user' };
    router.addRoute('/user/settings', staticPayload);
    router.addRoute('/user/:id', paramPayload);
    const staticRoute = router.getRoute('/user/settings');
    const paramRoute = router.getRoute('/user/123');
    strictEqual(staticRoute.payload, staticPayload);
    strictEqual(paramRoute.payload, paramPayload);
    strictEqual(paramRoute.keyParameters.get('id'), '123');
  });

  test('Root path handling', () => {
    const router = new Router();
    const payload = { name: 'root' };
    router.addRoute('/', payload);
    const route = router.getRoute('/');
    strictEqual(route.payload, payload);
  });

  test('Trailing slash normalization', () => {
    const router = new Router();
    const payload = { name: 'slash' };
    router.addRoute('/slash/', payload);
    const route = router.getRoute('/slash');
    strictEqual(route.payload, payload);
  });

  test('Non-existent route returns null', () => {
    const router = new Router();
    router.addRoute('/exists', { name: 'exists' });
    const route = router.getRoute('/does-not-exist');
    strictEqual(route, null);
  });

  test('Partial match does not return route', () => {
    const router = new Router();
    router.addRoute('/partial/match', { name: 'partial' });
    const route = router.getRoute('/partial');
    strictEqual(route, null);
  });

  test('Wildcard route matches extra segments', () => {
    const router = new Router();
    const payload = { name: 'wildcard' };
    router.addRoute('/wild/*', payload);
    const route = router.getRoute('/wild/extra/segments/here');
    strictEqual(route.payload, payload);
  });

  test('Parameterized route preferred over wildcard', () => {
    const router = new Router();
    const paramPayload = { name: 'param' };
    const wildcardPayload = { name: 'wildcard' };
    router.addRoute('/data/:id', paramPayload);
    router.addRoute('/data/*', wildcardPayload);
    const paramRoute = router.getRoute('/data/specific');
    const wildcardRoute = router.getRoute('/data/specific/more'); // Should still hit wildcard if param doesn't fully match
    strictEqual(paramRoute.payload, paramPayload);
    strictEqual(paramRoute.keyParameters.get('id'), 'specific');
    strictEqual(wildcardRoute.payload, wildcardPayload);
  });

  test('Adding duplicate route overwrites payload', () => {
    const router = new Router();
    const payload1 = { version: 1 };
    const payload2 = { version: 2 };
    const path = '/overwrite';
    router.addRoute(path, payload1);
    strictEqual(router.getRoute(path).payload, payload1);
    router.addRoute(path, payload2);
    strictEqual(router.getRoute(path).payload, payload2);
  });

  test('Adding route converts branch to leaf', () => {
    const router = new Router();
    router.addRoute('/branch/leaf', { name: 'child' });
    // At this point, '/branch' is a branch node
    strictEqual(router.getRoute('/branch'), null);
    router.addRoute('/branch', { name: 'parent' });
    // Now '/branch' should be a leaf node
    const route = router.getRoute('/branch');
    notStrictEqual(route, null);
    strictEqual(route.payload.name, 'parent');
    // Ensure child still exists
    const childRoute = router.getRoute('/branch/leaf');
     notStrictEqual(childRoute, null);
     strictEqual(childRoute.payload.name, 'child');
  });

  test('Path normalization adds leading slash', () => {
    const router = new Router();
    const payload = { name: 'leading' };
    router.addRoute('leading/slash', payload); // No leading slash
    const route = router.getRoute('/leading/slash'); // Get with leading slash
    strictEqual(route.payload, payload);
    const route2 = router.getRoute('leading/slash'); // Get without leading slash
    strictEqual(route2.payload, payload);
  });

  test('Add and retrieve mixed route types', () => {
    const router = new Router();
    const payload = { name: 'mixed' };
    router.addRoute('/users/:userId/posts/*', payload);
    const route = router.getRoute('/users/alice/posts/123/comments');
    strictEqual(route.payload, payload);
    strictEqual(route.keyParameters.get('userId'), 'alice');
  });

  test('Parameter match followed by non-matching segment returns null', () => {
    const router = new Router();
    router.addRoute('/users/:id/profile', { name: 'profile' });
    const route = router.getRoute('/users/123/settings'); // 'settings' doesn't match 'profile'
    strictEqual(route, null);
  });

   test('Retrieve route with multiple parameters checks positionalParameters', () => {
    const router = new Router();
    const payload = { name: 'multi-param-positional' };
    router.addRoute('/test/:id/:name', payload);
    const route = router.getRoute('/test/456/bob');
    strictEqual(route.payload, payload);
    deepStrictEqual(route.positionalParameters, [
      { parameter: 'id', value: '456' },
      { parameter: 'name', value: 'bob' },
    ]);
    strictEqual(route.keyParameters.get('id'), '456');
    strictEqual(route.keyParameters.get('name'), 'bob');
  });

  test('Router supports search parameters', () => {
    const router = new Router();
    const payload = { name: 'search' };
    router.addRoute('/search', payload);
    const route = router.getRoute('/search?q=test');
    strictEqual(route.payload, payload);
    strictEqual(route.searchParams.get('q'), 'test');
  });
});