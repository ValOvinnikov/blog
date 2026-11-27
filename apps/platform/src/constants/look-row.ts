import type { TValueOf } from '@shinefold/config/utils';

export const LOOK_ROW = {
  BRAND: 'BRAND',
  COLOUR: 'COLOUR',
  TYPE: 'TYPE',
  SHAPE: 'SHAPE',
  HEADER: 'HEADER',
  FOOTER: 'FOOTER',
  DETAILS: 'DETAILS',
} as const;

export type TLookRow = TValueOf<typeof LOOK_ROW>;
