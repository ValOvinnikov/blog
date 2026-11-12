import { GRID_COLUMNS, type TGridColumns } from '@blog/config';
import { MOCK_STALE_OPTION } from '@web/testing/shared/section-appearance/fixtures';

import { toCardGridColumns } from './to-card-grid-columns';

describe(toCardGridColumns, () => {
  it.each([
    { columns: GRID_COLUMNS.TWO, count: 2 },
    { columns: GRID_COLUMNS.THREE, count: 3 },
    { columns: GRID_COLUMNS.FOUR, count: 4 },
  ])('lays $columns out as $count columns', ({ columns, count }) => {
    expect(toCardGridColumns(columns)).toBe(count);
  });

  it.each([undefined, MOCK_STALE_OPTION as TGridColumns])(
    'leaves %s to the grid default',
    (columns) => {
      expect(toCardGridColumns(columns)).toBeUndefined();
    },
  );
});
