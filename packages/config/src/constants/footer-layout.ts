import type { TValueOf } from '@blog/config/utils';

export const FOOTER_LAYOUT = {
  COLUMNS: 'COLUMNS',
  CENTRED: 'CENTRED',
  COMPACT: 'COMPACT',
  BIG_WORDMARK: 'BIG_WORDMARK',
} as const;

export type TFooterLayout = TValueOf<typeof FOOTER_LAYOUT>;

export const FOOTER_SURFACE = {
  FULL_WIDTH: 'FULL_WIDTH',
  CARD: 'CARD',
} as const;

export type TFooterSurface = TValueOf<typeof FOOTER_SURFACE>;

export const COOKIE_SETTINGS_BUTTON = {
  HIDDEN: 'HIDDEN',
  SHOWN: 'SHOWN',
} as const;

export type TCookieSettingsButton = TValueOf<typeof COOKIE_SETTINGS_BUTTON>;
