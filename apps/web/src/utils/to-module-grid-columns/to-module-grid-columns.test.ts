import { toModuleGridColumns } from './to-module-grid-columns';

describe(toModuleGridColumns, () => {
  it.each([
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
  ])('lays out %i items in %i columns', (itemCount, expectedColumns) => {
    expect(toModuleGridColumns(itemCount)).toBe(expectedColumns);
  });
});
