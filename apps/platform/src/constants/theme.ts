import type { TValueOf } from '@blog/config/utils';

export const THEME_PREFERENCE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export type TThemePreference = TValueOf<typeof THEME_PREFERENCE>;

export const isThemePreference = (value: string): value is TThemePreference =>
  (Object.values(THEME_PREFERENCE) as string[]).includes(value);
