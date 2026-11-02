import 'server-only';

import {
  COLOR_SCHEME,
  type TColorScheme,
  type TMaybeUndefined,
} from '@blog/config';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';
import { cookies } from 'next/headers';

export const resolveThemeColorScheme = async (): Promise<
  TMaybeUndefined<TColorScheme>
> => {
  const cookieStore = await cookies();

  switch (cookieStore.get(THEME_PREFERENCE_COOKIE)?.value) {
    case THEME_PREFERENCE.LIGHT:
      return COLOR_SCHEME.LIGHT;
    case THEME_PREFERENCE.DARK:
      return COLOR_SCHEME.DARK;
    default:
      return undefined;
  }
};
