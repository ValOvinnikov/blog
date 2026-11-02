import 'server-only';

import {
  isThemePreference,
  THEME_PREFERENCE,
  type TThemePreference,
} from '@platform/constants/theme';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';
import { cookies } from 'next/headers';

export const resolveThemePreference = async (): Promise<TThemePreference> => {
  const cookieStore = await cookies();
  const stored = cookieStore.get(THEME_PREFERENCE_COOKIE)?.value;
  return stored !== undefined && isThemePreference(stored)
    ? stored
    : THEME_PREFERENCE.SYSTEM;
};
