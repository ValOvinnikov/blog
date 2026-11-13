import 'server-only';

import {
  COLOR_SCHEME,
  type TColorScheme,
  type TMaybeUndefined,
} from '@blog/config';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import { readRenamedCookie } from '@platform/server/renamed-cookie/read-renamed-cookie';
import {
  LEGACY_THEME_PREFERENCE_COOKIE,
  THEME_PREFERENCE_COOKIE,
} from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

export const resolveThemeColorScheme = async (): Promise<
  TMaybeUndefined<TColorScheme>
> => {
  const storedPreference = await readRenamedCookie({
    name: THEME_PREFERENCE_COOKIE,
    legacyName: LEGACY_THEME_PREFERENCE_COOKIE,
  });

  switch (storedPreference) {
    case THEME_PREFERENCE.LIGHT:
      return COLOR_SCHEME.LIGHT;
    case THEME_PREFERENCE.DARK:
      return COLOR_SCHEME.DARK;
    default:
      return undefined;
  }
};
