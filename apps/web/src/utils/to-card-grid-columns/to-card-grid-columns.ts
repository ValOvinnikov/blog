import {
  GRID_COLUMNS,
  type TGridColumns,
  type TMaybeUndefined,
} from '@blog/config';

const CARD_GRID_COLUMN_COUNT: Record<TGridColumns, 2 | 3 | 4> = {
  [GRID_COLUMNS.TWO]: 2,
  [GRID_COLUMNS.THREE]: 3,
  [GRID_COLUMNS.FOUR]: 4,
};

export const toCardGridColumns = (
  columns: TMaybeUndefined<TGridColumns>,
): TMaybeUndefined<2 | 3 | 4> =>
  columns ? CARD_GRID_COLUMN_COUNT[columns] : undefined;
