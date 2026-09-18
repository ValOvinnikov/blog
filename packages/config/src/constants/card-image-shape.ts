import type { TValueOf } from '@blog/config/utils';

export const CARD_IMAGE_SHAPE = {
  WIDE: 'WIDE',
  SQUARE: 'SQUARE',
  CIRCLE: 'CIRCLE',
  ICON: 'ICON',
} as const;

export type TCardImageShape = TValueOf<typeof CARD_IMAGE_SHAPE>;
