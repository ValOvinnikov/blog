import { EMAIL_TYPE } from '@blog/config/constants';
import type { IMagicLinkSendHandlers } from '@blog/config/types';
import { queries } from '@blog/db';

export async function recordSignInSendSafely(
  siteId: string,
  onSendCountFailed: IMagicLinkSendHandlers['onSendCountFailed'],
): Promise<void> {
  try {
    await queries.emailUsage.recordEmailSend(siteId, EMAIL_TYPE.SIGN_IN);
  } catch (error) {
    try {
      onSendCountFailed?.({ siteId, emailType: EMAIL_TYPE.SIGN_IN, error });
    } catch {
      return;
    }
  }
}
