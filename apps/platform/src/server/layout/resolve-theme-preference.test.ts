import { THEME_PREFERENCE } from '@platform/constants/theme';

import { resolveThemePreference } from './resolve-theme-preference';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

describe(resolveThemePreference, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it.each([
    { cookie: 'absent', value: undefined, expected: THEME_PREFERENCE.SYSTEM },
    {
      cookie: 'Light',
      value: THEME_PREFERENCE.LIGHT,
      expected: THEME_PREFERENCE.LIGHT,
    },
    {
      cookie: 'Dark',
      value: THEME_PREFERENCE.DARK,
      expected: THEME_PREFERENCE.DARK,
    },
    {
      cookie: 'System',
      value: THEME_PREFERENCE.SYSTEM,
      expected: THEME_PREFERENCE.SYSTEM,
    },
    {
      cookie: 'an unknown value',
      value: 'sepia',
      expected: THEME_PREFERENCE.SYSTEM,
    },
  ])(
    'resolves $expected when the cookie is $cookie',
    async ({ value, expected }) => {
      mockCookie(value);

      expect(await resolveThemePreference()).toBe(expected);
    },
  );
});
