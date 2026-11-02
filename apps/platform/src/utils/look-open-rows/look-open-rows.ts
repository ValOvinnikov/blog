import type { TLookCardKey } from '@platform/utils/look-form-values/look-form-values';

export type TLookRowKey = Exclude<TLookCardKey, 'preset'>;

export const STYLE_ROWS = [
  'colour',
  'brand',
  'type',
  'shape',
  'buttons',
] as const satisfies readonly TLookRowKey[];

export const SITE_PARTS_ROWS = [
  'header',
  'footer',
  'languageSwitcher',
] as const satisfies readonly TLookRowKey[];

export const nextOpenRows = (
  openRows: readonly TLookRowKey[],
  groupRows: readonly TLookRowKey[],
  nextGroupRows: readonly TLookRowKey[],
): TLookRowKey[] => {
  const opened = nextGroupRows.find((row) => !openRows.includes(row));
  if (opened) return [opened];
  return openRows.filter(
    (row) => !groupRows.includes(row) || nextGroupRows.includes(row),
  );
};

export const revealOpenRow = (
  openRows: readonly TLookRowKey[],
  row: TLookRowKey,
): TLookRowKey[] =>
  openRows.includes(row) ? [...openRows] : [...openRows, row];
