import { COLOR_SCHEME } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import {
  LEGACY_THEME_PREFERENCE_COOKIE,
  THEME_PREFERENCE_COOKIE,
} from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

import { resolveThemeColorScheme } from './resolve-theme-color-scheme';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const MOCK_UNKNOWN_PREFERENCE = 'SEPIA';

const mockCookies = (stored: Partial<Record<string, string>>) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) => {
      const value = stored[name];
      return isUndefined(value) ? undefined : { value };
    }),
  });
};

describe(resolveThemeColorScheme, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it.each([
    {
      cookie: 'Light',
      value: THEME_PREFERENCE.LIGHT,
      expected: COLOR_SCHEME.LIGHT,
    },
    {
      cookie: 'Dark',
      value: THEME_PREFERENCE.DARK,
      expected: COLOR_SCHEME.DARK,
    },
  ])(
    'resolves $expected when the cookie is $cookie',
    async ({ value, expected }) => {
      mockCookies({ [THEME_PREFERENCE_COOKIE]: value });

      expect(await resolveThemeColorScheme()).toBe(expected);
    },
  );

  it.each([
    { cookie: 'absent', value: undefined },
    { cookie: 'System', value: THEME_PREFERENCE.SYSTEM },
    { cookie: 'an unknown value', value: MOCK_UNKNOWN_PREFERENCE },
  ])(
    'follows the device setting when the cookie is $cookie',
    async ({ value }) => {
      mockCookies({ [THEME_PREFERENCE_COOKIE]: value });

      expect(await resolveThemeColorScheme()).toBeUndefined();
    },
  );

  it('keeps a choice saved under the legacy cookie', async () => {
    mockCookies({ [LEGACY_THEME_PREFERENCE_COOKIE]: THEME_PREFERENCE.DARK });

    expect(await resolveThemeColorScheme()).toBe(COLOR_SCHEME.DARK);
  });

  it('prefers the current cookie over the legacy one', async () => {
    mockCookies({
      [THEME_PREFERENCE_COOKIE]: THEME_PREFERENCE.SYSTEM,
      [LEGACY_THEME_PREFERENCE_COOKIE]: THEME_PREFERENCE.DARK,
    });

    expect(await resolveThemeColorScheme()).toBeUndefined();
  });
});
