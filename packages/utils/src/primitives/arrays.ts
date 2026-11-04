export const hasArrayGotItems = <T>(
  items: readonly T[] | undefined,
): items is readonly [T, ...T[]] => items !== undefined && items.length > 0;

export const hasLength = (
  value: { readonly length: number } | undefined,
): boolean => value !== undefined && value.length > 0;
