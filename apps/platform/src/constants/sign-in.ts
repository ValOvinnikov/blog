import type { TValueOf } from '@blog/config/utils';

export const SIGN_IN_ERROR = {
  ACCOUNT_NOT_LINKED: 'ACCOUNT_NOT_LINKED',
  SIGN_IN_FAILED: 'SIGN_IN_FAILED',
} as const;

export type TSignInError = TValueOf<typeof SIGN_IN_ERROR>;

export const SIGN_IN_LOG = {
  LINK_FAILED: 'auth.sign_in_link_failed',
  LINK_REFUSED: 'auth.sign_in_link_refused',
} as const;
