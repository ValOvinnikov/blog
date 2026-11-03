import { COLOR_SCHEME } from '@blog/config';
import {
  DATA_THEME,
  THEME_PREFERENCE,
  type TThemePreference,
} from '@platform/constants/theme';
import { setPersistentCookie } from '@platform/utils/persistent-cookie/persistent-cookie';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';
import { useState } from 'react';

// The root layout never re-renders on client navigation, so `<html data-theme>` holds the live choice, not the server's first read.
const readThemePreference = (): TThemePreference => {
  switch (document.documentElement.dataset.theme) {
    case DATA_THEME[COLOR_SCHEME.LIGHT]:
      return THEME_PREFERENCE.LIGHT;
    case DATA_THEME[COLOR_SCHEME.DARK]:
      return THEME_PREFERENCE.DARK;
    default:
      return THEME_PREFERENCE.SYSTEM;
  }
};

const applyThemePreference = (preference: TThemePreference) => {
  const root = document.documentElement;

  if (preference === THEME_PREFERENCE.SYSTEM) {
    delete root.dataset.theme;
    return;
  }

  root.dataset.theme = DATA_THEME[preference];
};

export const useThemePreference = () => {
  const [preference, setPreference] =
    useState<TThemePreference>(readThemePreference);

  const choose = (next: TThemePreference) => {
    setPersistentCookie(THEME_PREFERENCE_COOKIE, next);
    applyThemePreference(next);
    setPreference(next);
  };

  return { preference, choose };
};
