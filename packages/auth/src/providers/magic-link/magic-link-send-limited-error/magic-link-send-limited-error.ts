import { MAGIC_LINK_SIGN_IN_CODE } from '@blog/config/constants';
import { CredentialsSignin } from 'next-auth';

// A `CredentialsSignin` because it is the one Auth.js error whose `code` reaches a client sign-in as-is.
export class MagicLinkSendLimitedError extends CredentialsSignin {
  override code = MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED;
}
