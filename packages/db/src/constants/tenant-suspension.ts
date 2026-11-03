import type { TValueOf } from '@blog/config/utils';

export const SUSPENSION_CATEGORY = {
  ABUSE: 'ABUSE',
  ILLEGAL_CONTENT: 'ILLEGAL_CONTENT',
  TERMS_VIOLATION: 'TERMS_VIOLATION',
  OTHER: 'OTHER',
} as const;

export type TSuspensionCategory = TValueOf<typeof SUSPENSION_CATEGORY>;

export const SUSPENSION_REFERENCE_PREFIX = 'SUS-';

export const SUSPENSION_REFERENCE_DIGITS = 6;
