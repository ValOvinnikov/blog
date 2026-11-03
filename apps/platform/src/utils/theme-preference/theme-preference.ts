import { COLOR_SCHEME, type TMaybeUndefined } from '@blog/config';
import {
  DATA_THEME,
  THEME_PREFERENCE,
  type TThemePreference,
} from '@platform/constants/theme';
import { setPersistentCookie } from '@platform/utils/persistent-cookie/persistent-cookie';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

export const themePreferenceFor = (
  scheme: TMaybeUndefined<string>,
): TThemePreference => {
  switch (scheme) {
    case DATA_THEME[COLOR_SCHEME.LIGHT]:
      return THEME_PREFERENCE.LIGHT;
    case DATA_THEME[COLOR_SCHEME.DARK]:
      return THEME_PREFERENCE.DARK;
    default:
      return THEME_PREFERENCE.SYSTEM;
  }
};

// The root layout never re-renders on client navigation, so `<html data-theme>` holds the live choice, not the server's first read.
export const readThemePreference = (): TThemePreference =>
  themePreferenceFor(document.documentElement.dataset.theme);

const themePreferenceListeners = new Set<() => void>();

export const subscribeThemePreference = (onChange: () => void) => {
  themePreferenceListeners.add(onChange);
  return () => {
    themePreferenceListeners.delete(onChange);
  };
};

export const storeThemePreference = (preference: TThemePreference) => {
  setPersistentCookie(THEME_PREFERENCE_COOKIE, preference);

  const root = document.documentElement;

  if (preference === THEME_PREFERENCE.SYSTEM) {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = DATA_THEME[preference];
  }

  themePreferenceListeners.forEach((onChange) => onChange());
};
