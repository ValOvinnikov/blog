export const hasArrayGotItems = <T>(
  items: readonly T[],
): items is readonly [T, ...T[]] => items.length > 0;
