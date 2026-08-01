import type { TValueOf } from '@blog/config/utils';

export const IMAGE_LAYOUT = {
  INLINE: 'INLINE',
  FULL_BLEED: 'FULL_BLEED',
  FLOAT_LEFT: 'FLOAT_LEFT',
  FLOAT_RIGHT: 'FLOAT_RIGHT',
} as const;

export type TImageLayout = TValueOf<typeof IMAGE_LAYOUT>;
