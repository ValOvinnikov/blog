import { toSafeCallbackPath } from './safe-callback-path';

describe(toSafeCallbackPath, () => {
  it.each(['/', '/dashboard/leads?page=2', '/tenants#archived'])(
    'keeps the same-origin path %s',
    (path) => {
      expect(toSafeCallbackPath(path)).toBe(path);
    },
  );

  it.each([
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    'https://evil.example/',
    '',
    undefined,
  ])('falls back to home for %j, which could leave this origin', (value) => {
    expect(toSafeCallbackPath(value)).toBe('/');
  });
});
