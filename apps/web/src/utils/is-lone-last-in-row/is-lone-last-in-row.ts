export const isLoneLastInRow = (itemCount: number, perRow: number): boolean =>
  perRow > 1 && itemCount > perRow && itemCount % perRow === 1;
