import { COLOR_SCHEME } from '@blog/config';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import { mockCookies } from '@platform/testing/mock-cookies';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

import { resolveThemeColorScheme } from './resolve-theme-color-scheme';

const MOCK_UNKNOWN_PREFERENCE = 'SEPIA';

describe(resolveThemeColorScheme, () => {
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
});
