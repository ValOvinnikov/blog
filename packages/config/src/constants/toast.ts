import type { TValueOf } from '@blog/config/utils';

export const TOAST_TYPE = {
  SUCCESS: 'SUCCESS',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type TToastType = TValueOf<typeof TOAST_TYPE>;
