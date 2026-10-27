import { toModuleGridColumns } from './to-module-grid-columns';

const MIN_ITEM_COUNT = 2;
const MAX_ITEM_COUNT = 12;

const ITEM_COUNTS = Array.from(
  { length: MAX_ITEM_COUNT - MIN_ITEM_COUNT + 1 },
  (_, index) => MIN_ITEM_COUNT + index,
);

describe(toModuleGridColumns, () => {
  it.each(ITEM_COUNTS)(
    'leaves no row with a single orphaned item for %i items',
    (itemCount) => {
      const columns = toModuleGridColumns(itemCount);

      expect(itemCount % columns).not.toBe(1);
    },
  );

  it.each(ITEM_COUNTS)(
    'never uses more columns than items for %i',
    (itemCount) => {
      expect(toModuleGridColumns(itemCount)).toBeLessThanOrEqual(itemCount);
    },
  );
});
