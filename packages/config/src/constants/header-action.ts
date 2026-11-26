import type { TValueOf } from '@shinefold/config/utils';

export const HEADER_ACTION_STYLE = {
  FILLED: 'FILLED',
  OUTLINED: 'OUTLINED',
  PLAIN: 'PLAIN',
} as const;

export type THeaderActionStyle = TValueOf<typeof HEADER_ACTION_STYLE>;

export const HEADER_ACTION_PHONE_PLACEMENT = {
  BAR: 'BAR',
  MENU: 'MENU',
} as const;

export type THeaderActionPhonePlacement = TValueOf<
  typeof HEADER_ACTION_PHONE_PLACEMENT
>;
