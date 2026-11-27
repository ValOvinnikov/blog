import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

export const LOOK_ROWS = [
  LOOK_ROW.BRAND,
  LOOK_ROW.COLOUR,
  LOOK_ROW.TYPE,
  LOOK_ROW.SHAPE,
  LOOK_ROW.HEADER,
  LOOK_ROW.FOOTER,
  LOOK_ROW.DETAILS,
] as const satisfies readonly TLookRow[];

export const LOOK_CARDS = [
  LOOK_CARD.PRESET,
  ...LOOK_ROWS,
] as const satisfies readonly TLookCard[];

export const nextOpenRows = (
  openRows: readonly TLookRow[],
  nextRows: readonly TLookRow[],
): TLookRow[] => {
  const opened = nextRows.find((row) => !openRows.includes(row));
  return opened ? [opened] : [...nextRows];
};

export const revealOpenRow = (
  openRows: readonly TLookRow[],
  row: TLookRow,
): TLookRow[] => (openRows.includes(row) ? [...openRows] : [...openRows, row]);
