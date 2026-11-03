import type { TValueOf } from '@blog/config/utils';

export const LOOK_ROW = {
  COLOUR: 'COLOUR',
  BRAND: 'BRAND',
  TYPE: 'TYPE',
  SHAPE: 'SHAPE',
  BUTTONS: 'BUTTONS',
  HEADER: 'HEADER',
  FOOTER: 'FOOTER',
  LANGUAGE_SWITCHER: 'LANGUAGE_SWITCHER',
} as const;

export type TLookRow = TValueOf<typeof LOOK_ROW>;
