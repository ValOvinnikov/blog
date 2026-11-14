import { mockCookies } from '@platform/testing/mock-cookies';

import { readRenamedCookie } from './read-renamed-cookie';

const MOCK_COOKIE = { name: 'current', legacyName: 'legacy' };
const MOCK_CURRENT_VALUE = 'current-value';
const MOCK_LEGACY_VALUE = 'legacy-value';

describe(readRenamedCookie, () => {
  it('reads the current name first', async () => {
    mockCookies({
      [MOCK_COOKIE.name]: MOCK_CURRENT_VALUE,
      [MOCK_COOKIE.legacyName]: MOCK_LEGACY_VALUE,
    });

    expect(await readRenamedCookie(MOCK_COOKIE)).toBe(MOCK_CURRENT_VALUE);
  });

  it('falls back to the legacy name', async () => {
    mockCookies({ [MOCK_COOKIE.legacyName]: MOCK_LEGACY_VALUE });

    expect(await readRenamedCookie(MOCK_COOKIE)).toBe(MOCK_LEGACY_VALUE);
  });

  it('resolves undefined when neither is set', async () => {
    expect(await readRenamedCookie(MOCK_COOKIE)).toBeUndefined();
  });
});
