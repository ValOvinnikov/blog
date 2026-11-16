import type { TValueOf } from '@shinefold/config/utils';

export const REDIRECT_STATUS = {
  PERMANENT: 'PERMANENT',
  TEMPORARY: 'TEMPORARY',
} as const;

export type TRedirectStatus = TValueOf<typeof REDIRECT_STATUS>;
