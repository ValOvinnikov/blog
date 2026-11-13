import 'server-only';

import {
  COLOR_SCHEME,
  type TColorScheme,
  type TMaybeUndefined,
} from '@blog/config';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import {
  LEGACY_THEME_PREFERENCE_COOKIE,
  THEME_PREFERENCE_COOKIE,
} from '@platform/utils/theme-preference-cookie/theme-preference-cookie';
import { cookies } from 'next/headers';

export const resolveThemeColorScheme = async (): Promise<
  TMaybeUndefined<TColorScheme>
> => {
  const cookieStore = await cookies();

  const storedPreference = (
    cookieStore.get(THEME_PREFERENCE_COOKIE) ??
    cookieStore.get(LEGACY_THEME_PREFERENCE_COOKIE)
  )?.value;

  switch (storedPreference) {
    case THEME_PREFERENCE.LIGHT:
      return COLOR_SCHEME.LIGHT;
    case THEME_PREFERENCE.DARK:
      return COLOR_SCHEME.DARK;
    default:
      return undefined;
  }
};
