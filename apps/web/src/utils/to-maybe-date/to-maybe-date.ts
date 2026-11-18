import type { TMaybeNull } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';

export const toMaybeDate = (
  value: TMaybeNull<Date | string>,
): TMaybeNull<Date> => (isNull(value) ? null : new Date(value));
