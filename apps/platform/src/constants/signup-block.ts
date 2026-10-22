import type { TValueOf } from '@blog/config/utils';

export const SIGNUP_BLOCK_FIELD_ERROR = {
  BLOCK_DOMAIN_INVALID: 'BLOCK_DOMAIN_INVALID',
  BLOCK_REASON_REQUIRED: 'BLOCK_REASON_REQUIRED',
} as const;

export type TSignupBlockFieldError = TValueOf<typeof SIGNUP_BLOCK_FIELD_ERROR>;

export const SIGNUP_BLOCK_REFUSAL = {
  ENTRY_NOT_FOUND: 'ENTRY_NOT_FOUND',
} as const;

export const SIGNUP_BLOCK_REASON_MAX_LENGTH = 500;
