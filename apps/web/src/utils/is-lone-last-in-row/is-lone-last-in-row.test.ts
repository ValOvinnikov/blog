import { isLoneLastInRow } from './is-lone-last-in-row';

describe(isLoneLastInRow, () => {
  it.each([
    [7, 2],
    [7, 3],
    [4, 3],
    [5, 2],
  ])(
    'is true when %i items leave one on the last row of %i',
    (count, perRow) => {
      expect(isLoneLastInRow(count, perRow)).toBe(true);
    },
  );

  it.each([
    [6, 3],
    [5, 3],
    [8, 2],
    [7, 4],
  ])(
    'is false when %i items fill or share the last row of %i',
    (count, perRow) => {
      expect(isLoneLastInRow(count, perRow)).toBe(false);
    },
  );

  it('is false for a single item or a single column', () => {
    expect(isLoneLastInRow(1, 2)).toBe(false);
    expect(isLoneLastInRow(5, 1)).toBe(false);
  });
});
