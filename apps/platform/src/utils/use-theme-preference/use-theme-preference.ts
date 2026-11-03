import { THEME_PREFERENCE } from '@platform/constants/theme';
import {
  readThemePreference,
  storeThemePreference,
  subscribeThemePreference,
} from '@platform/utils/theme-preference/theme-preference';
import { useSyncExternalStore } from 'react';

export const useThemePreference = () => {
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    () => THEME_PREFERENCE.SYSTEM,
  );

  return { preference, choose: storeThemePreference };
};
