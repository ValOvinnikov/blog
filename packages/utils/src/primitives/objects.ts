export const objectKeys = <T extends object>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>;

export const mapKeysToRecord = <K extends PropertyKey, V>(
  keys: readonly K[],
  toValue: (key: K) => V,
): Record<K, V> =>
  Object.fromEntries(keys.map((key) => [key, toValue(key)])) as Record<K, V>;

/** Assumes SCREAMING_SNAKE_CASE input (this repo's UPPERCASE const-value convention). */
export const toTitleCase = (value: string): string =>
  value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

export const toOptions = <TValue extends string>(
  vocabulary: Record<string, TValue>,
  toLabel: (value: TValue) => string,
): { value: TValue; label: string }[] =>
  Object.values(vocabulary).map((value) => ({ value, label: toLabel(value) }));
