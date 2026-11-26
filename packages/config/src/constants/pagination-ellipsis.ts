import type { TValueOf } from '@shinefold/config/utils';

export const PAGINATION_ELLIPSIS = {
  START: 'START',
  END: 'END',
} as const;

export type TPaginationEllipsis = TValueOf<typeof PAGINATION_ELLIPSIS>;
