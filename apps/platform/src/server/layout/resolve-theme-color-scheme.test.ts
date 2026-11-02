import { COLOR_SCHEME } from '@blog/config';
import { THEME_PREFERENCE } from '@platform/constants/theme';

import { resolveThemeColorScheme } from './resolve-theme-color-scheme';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const MOCK_UNKNOWN_PREFERENCE = 'SEPIA';

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
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
      mockCookie(value);

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
      mockCookie(value);

      expect(await resolveThemeColorScheme()).toBeUndefined();
    },
  );
});
