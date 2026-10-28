export const hasArrayGotItems = <T>(
  items: readonly T[] | undefined,
): items is readonly [T, ...T[]] => items !== undefined && items.length > 0;
