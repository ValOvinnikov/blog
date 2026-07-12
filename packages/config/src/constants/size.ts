import type { TValueOf } from '@blog/config/utils';

export const Size = {
  XS: 'XS',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
  XXL: 'XXL',
} as const;

export type TSize = TValueOf<typeof Size>;
