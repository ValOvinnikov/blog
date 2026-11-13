import { EMAIL_ACCOUNT, sendEmail } from '@blog/email';
import type { TOwnerEmail } from '@blog/email/templates/owner/owner-email/owner-email';
import { sanitizeLogMessage } from '@blog/insight';
import { logger } from '@worker/utils/logger/logger';

import { ownerEmailFromAddress } from './owner-email-context';

type TOwnerMessageSend = {
  to: string;
  message: TOwnerEmail;
  failedEvent: string;
  context: Record<string, string>;
};

export async function sendOwnerMessage({
  to,
  message,
  failedEvent,
  context,
}: TOwnerMessageSend): Promise<void> {
  try {
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to,
      from: ownerEmailFromAddress(),
      ...message,
    });
  } catch (error) {
    logger.error(failedEvent, {
      ...context,
      error: sanitizeLogMessage(error),
    });
  }
}
