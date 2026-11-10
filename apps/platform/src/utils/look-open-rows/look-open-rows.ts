import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

export const STYLE_ROWS = [
  LOOK_ROW.COLOUR,
  LOOK_ROW.BRAND,
  LOOK_ROW.TYPE,
  LOOK_ROW.SHAPE,
  LOOK_ROW.CARDS,
  LOOK_ROW.BUTTONS,
] as const satisfies readonly TLookRow[];

export const SITE_PARTS_ROWS = [
  LOOK_ROW.HEADER,
  LOOK_ROW.FOOTER,
  LOOK_ROW.LANGUAGE_SWITCHER,
] as const satisfies readonly TLookRow[];

export const LOOK_ROWS = [
  ...STYLE_ROWS,
  ...SITE_PARTS_ROWS,
] as const satisfies readonly TLookRow[];

export const LOOK_CARDS = [
  LOOK_CARD.PRESET,
  ...LOOK_ROWS,
] as const satisfies readonly TLookCard[];

export const nextOpenRows = (
  openRows: readonly TLookRow[],
  groupRows: readonly TLookRow[],
  nextGroupRows: readonly TLookRow[],
): TLookRow[] => {
  const opened = nextGroupRows.find((row) => !openRows.includes(row));
  if (opened) return [opened];
  return openRows.filter(
    (row) => !groupRows.includes(row) || nextGroupRows.includes(row),
  );
};

export const revealOpenRow = (
  openRows: readonly TLookRow[],
  row: TLookRow,
): TLookRow[] => (openRows.includes(row) ? [...openRows] : [...openRows, row]);
