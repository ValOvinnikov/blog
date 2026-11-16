import type { TValueOf } from '@shinefold/config/utils';

import { LOOK_ROW } from './look-row';

export const LOOK_CARD = {
  ...LOOK_ROW,
  PRESET: 'PRESET',
} as const;

export type TLookCard = TValueOf<typeof LOOK_CARD>;
