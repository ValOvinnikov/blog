export type TDeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? TDeepPartial<T[K]>
    : T[K];
};

/**
 * Merges plain nested objects key-by-key, left to right. An override's
 * absent/`undefined` key leaves `base`'s value in place; a defined leaf
 * value replaces it. No array-merge semantics — every leaf here is a
 * primitive.
 */
export function deepMergePartial<T extends Record<string, unknown>>(
  base: T,
  ...overrides: Array<TDeepPartial<T> | undefined>
): T {
  const result: T = { ...base };

  for (const override of overrides) {
    if (!override) continue;

    for (const key of Object.keys(override) as Array<keyof T>) {
      const overrideValue = override[key];
      if (overrideValue === undefined) continue;

      const baseValue = result[key];
      if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
        result[key] = deepMergePartial(
          baseValue as Record<string, unknown>,
          overrideValue as TDeepPartial<Record<string, unknown>>,
        ) as T[keyof T];
      } else {
        result[key] = overrideValue as T[keyof T];
      }
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
