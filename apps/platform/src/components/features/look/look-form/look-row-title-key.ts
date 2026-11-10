import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

export const LOOK_ROW_TITLE_KEY = {
  [LOOK_ROW.COLOUR]: 'colourHeading',
  [LOOK_ROW.BRAND]: 'brandHeading',
  [LOOK_ROW.TYPE]: 'typeHeading',
  [LOOK_ROW.SHAPE]: 'shapeHeading',
  [LOOK_ROW.CARDS]: 'cardsHeading',
  [LOOK_ROW.BUTTONS]: 'buttonsHeading',
  [LOOK_ROW.HEADER]: 'headerHeading',
  [LOOK_ROW.FOOTER]: 'footerHeading',
  [LOOK_ROW.LANGUAGE_SWITCHER]: 'languageSwitcherLabel',
} as const satisfies Record<TLookRow, string>;
