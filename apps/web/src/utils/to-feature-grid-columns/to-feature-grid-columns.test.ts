import { toFeatureGridColumns } from './to-feature-grid-columns';

describe(toFeatureGridColumns, () => {
  it.each([
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
  ])('lays out %i items in %i columns', (itemCount, expectedColumns) => {
    expect(toFeatureGridColumns(itemCount)).toBe(expectedColumns);
  });
});
