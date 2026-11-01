import type { TValueOf } from '@blog/config/utils';

export const MENU_RADIO_GROUP_SIZE = {
  DESKTOP: 'DESKTOP',
  TOUCH: 'TOUCH',
} as const;

export type TMenuRadioGroupSize = TValueOf<typeof MENU_RADIO_GROUP_SIZE>;
