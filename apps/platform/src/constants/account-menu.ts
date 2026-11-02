import type { TValueOf } from '@blog/config/utils';

export const ACCOUNT_MENU_APPEARANCE = {
  SIDEBAR: 'SIDEBAR',
  PILL: 'PILL',
} as const;

export type TAccountMenuAppearance = TValueOf<typeof ACCOUNT_MENU_APPEARANCE>;
