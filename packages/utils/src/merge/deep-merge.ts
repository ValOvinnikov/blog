import { isPlainObject } from '@shinefold/utils/primitives';

export type TDeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? TDeepPartial<T[K]>
    : T[K];
};

/** An override's `undefined` key keeps `base`'s value, and an array replaces rather than merges. */
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
