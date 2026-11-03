import type { TMaybeUndefined, TNullable } from '@blog/config';

export const joinIds = (
  ...ids: TNullable<string | false>[]
): TMaybeUndefined<string> => ids.filter(Boolean).join(' ') || undefined;
