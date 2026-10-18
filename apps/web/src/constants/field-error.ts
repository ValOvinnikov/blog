import type { TValueOf } from '@blog/config/utils';

export const FIELD_ERROR = {
  INVALID: 'INVALID',
} as const;

export type TFieldErrorReason = TValueOf<typeof FIELD_ERROR>;
