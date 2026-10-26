import type { TValueOf } from '@blog/config/utils';

export const MAGIC_LINK_REFUSAL = {
  BLOCKED: 'BLOCKED',
  NETWORK_LIMIT: 'NETWORK_LIMIT',
  ADDRESS_LIMIT: 'ADDRESS_LIMIT',
  CHECK_FAILED: 'CHECK_FAILED',
} as const;

export type TMagicLinkRefusal = TValueOf<typeof MAGIC_LINK_REFUSAL>;

export const MAGIC_LINK_SIGN_IN_CODE = {
  SEND_LIMITED: 'SEND_LIMITED',
} as const;
