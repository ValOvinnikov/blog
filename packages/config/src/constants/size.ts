import type { TValueOf } from '@shinefold/config/utils';

export const SIZE = {
  XS: 'XS',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
  XXL: 'XXL',
} as const;

export type TSize = TValueOf<typeof SIZE>;
