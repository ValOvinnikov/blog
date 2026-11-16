import type { TValueOf } from '@shinefold/config/utils';

export const IMAGE_PROPORTION = {
  AS_DESIGNED: 'AS_DESIGNED',
  WIDE: 'WIDE',
  CLASSIC: 'CLASSIC',
  SQUARE: 'SQUARE',
} as const;

export type TImageProportion = TValueOf<typeof IMAGE_PROPORTION>;
