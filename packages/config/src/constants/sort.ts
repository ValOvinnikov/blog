import type { TValueOf } from '@shinefold/config/utils';

export const SORT_DIRECTION = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
} as const;

export type TSortDirection = TValueOf<typeof SORT_DIRECTION>;
