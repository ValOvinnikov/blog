import type {
  IEmailSendCount,
  IMagicLinkSendHandlers,
} from '@shinefold/config/types';
import { queries } from '@shinefold/db';

export async function recordMagicLinkSendSafely(
  { siteId, emailType }: IEmailSendCount,
  onSendCountFailed: IMagicLinkSendHandlers['onSendCountFailed'],
): Promise<void> {
  try {
    await (siteId
      ? queries.emailUsage.recordEmailSend(siteId, emailType)
      : queries.emailUsage.recordPlatformEmailSend(emailType));
  } catch (error) {
    try {
      onSendCountFailed?.({ siteId, emailType, error });
    } catch {
      return;
    }
  }
}
