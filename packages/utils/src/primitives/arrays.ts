export const hasArrayGotItems = <T>(
  items: readonly T[] | undefined,
): items is readonly [T, ...T[]] => items !== undefined && items.length > 0;

export const hasLength = <T extends { readonly length: number }>(
  value: T | undefined,
): value is T => value !== undefined && value.length > 0;
