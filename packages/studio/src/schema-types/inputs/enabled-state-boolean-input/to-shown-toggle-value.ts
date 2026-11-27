import type { TMaybeUndefined } from '@shinefold/config/types';

export const toShownToggleValue = (
  value: TMaybeUndefined<boolean>,
  initialValue: unknown,
): TMaybeUndefined<boolean> =>
  value ?? (typeof initialValue === 'boolean' ? initialValue : undefined);
