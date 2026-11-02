import { COLOR_SCHEME } from '@blog/config';

export const THEME_PREFERENCE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export const DATA_THEME = {
  [COLOR_SCHEME.LIGHT]: 'light',
  [COLOR_SCHEME.DARK]: 'dark',
} as const;
