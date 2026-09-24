const MODULE_GRID_COLUMNS_BY_ITEM_COUNT: Record<number, 1 | 2 | 3 | 4> = {
  2: 2,
  3: 3,
  4: 4,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
};

// Full-rows rule: 5/6 use 3 columns and 7 uses 4, not a naive progression, so no row is left with one orphaned item.
export const toModuleGridColumns = (itemCount: number): 1 | 2 | 3 | 4 =>
  MODULE_GRID_COLUMNS_BY_ITEM_COUNT[itemCount] ?? 4;
