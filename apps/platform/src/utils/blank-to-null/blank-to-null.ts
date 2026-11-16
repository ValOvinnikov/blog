import type { TMaybeNull } from '@shinefold/config';

export const blankToNull = (value: string): TMaybeNull<string> => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};
