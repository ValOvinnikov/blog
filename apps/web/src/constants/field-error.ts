import type { TValueOf } from '@shinefold/config/utils';

export const FIELD_ERROR = {
  INVALID: 'INVALID',
} as const;

export type TFieldErrorReason = TValueOf<typeof FIELD_ERROR>;
