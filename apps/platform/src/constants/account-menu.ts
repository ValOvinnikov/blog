import type { TValueOf } from '@blog/config/utils';

export const ACCOUNT_MENU_APPEARANCE = {
  SIDEBAR: 'SIDEBAR',
  PILL: 'PILL',
} as const;

export type TAccountMenuAppearance = TValueOf<typeof ACCOUNT_MENU_APPEARANCE>;

export const ACCOUNT_MENU_PLACEMENT = {
  FOOT: 'FOOT',
  RAIL: 'RAIL',
  PILL: 'PILL',
} as const;

export type TAccountMenuPlacement = TValueOf<typeof ACCOUNT_MENU_PLACEMENT>;
