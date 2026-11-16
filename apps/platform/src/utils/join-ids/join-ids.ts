import type { TMaybeUndefined, TNullable } from '@shinefold/config';

export const joinIds = (
  ...ids: TNullable<string | false>[]
): TMaybeUndefined<string> => ids.filter(Boolean).join(' ') || undefined;
