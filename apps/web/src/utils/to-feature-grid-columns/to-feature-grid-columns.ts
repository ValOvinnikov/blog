const FEATURE_GRID_COLUMNS_BY_ITEM_COUNT: Record<number, 1 | 2 | 3 | 4> = {
  2: 2,
  3: 3,
  4: 4,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
};

/**
 * Full-rows rule: 5 and 6 cards use 3 columns rather than 4, and 7 uses 4
 * rather than 3, so the grid's last row is never left with a single
 * orphaned card.
 */
export const toFeatureGridColumns = (itemCount: number): 1 | 2 | 3 | 4 =>
  FEATURE_GRID_COLUMNS_BY_ITEM_COUNT[itemCount] ?? 4;
