import { COLOR_SCHEME } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';

export const THEME_PREFERENCE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export type TThemePreference = TValueOf<typeof THEME_PREFERENCE>;

export const DATA_THEME = {
  [COLOR_SCHEME.LIGHT]: 'light',
  [COLOR_SCHEME.DARK]: 'dark',
} as const;
