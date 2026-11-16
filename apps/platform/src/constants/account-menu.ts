import type { TValueOf } from '@shinefold/config/utils';

export const ACCOUNT_MENU_PLACEMENT = {
  FOOT: 'FOOT',
  RAIL: 'RAIL',
  MENU: 'MENU',
} as const;

export type TAccountMenuPlacement = TValueOf<typeof ACCOUNT_MENU_PLACEMENT>;
