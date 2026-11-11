import { EMAIL_TYPE } from '@blog/config/constants';
import { queries } from '@blog/db';

export async function recordSignInSendSafely(siteId: string): Promise<void> {
  try {
    await queries.emailUsage.recordEmailSend(siteId, EMAIL_TYPE.SIGN_IN);
  } catch {
    // The link is already sent; a lost count must not turn it into a failed sign-in.
  }
}
