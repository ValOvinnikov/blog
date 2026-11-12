import { EMAIL_TYPE } from '@blog/config/constants';
import { recordEmailSend } from '@blog/db/queries/email-usage';
import type { IActiveSubscriber } from '@blog/db/queries/subscribers';
import { sendEmail } from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import { hasLength } from '@blog/utils/primitives';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import type { TNewsletterPageInput } from '@worker/units/newsletter-send/send-newsletter-page';
import { logger } from '@worker/utils/logger/logger';
import { buildPostSend } from '@worker/utils/newsletter-send/build-post-send';
import type { TNewsletterSendContext } from '@worker/utils/newsletter-send/newsletter-send-context';
import { FatalError } from 'workflow';

export function assertPageReadable(
  { tenantId, postId }: TNewsletterPageInput,
  subscribers: IActiveSubscriber[],
): void {
  if (hasLength(subscribers) && subscribers.every(({ email }) => !email)) {
    logger.error(NEWSLETTER_SEND_LOG.PAGE_UNREADABLE, {
      tenantId,
      postId,
      count: subscribers.length,
    });
    throw new FatalError(
      `No address on a page of tenant "${tenantId}" could be decrypted.`,
    );
  }
}

export async function sendToSubscriber(
  { tenantId, postId, post }: TNewsletterPageInput,
  context: TNewsletterSendContext,
  { id: subscriberId, email }: IActiveSubscriber,
): Promise<void> {
  if (!email) {
    logger.error(NEWSLETTER_SEND_LOG.SUBSCRIBER_UNREADABLE, {
      tenantId,
      subscriberId,
    });
    return;
  }

  try {
    await sendEmail(
      buildPostSend(context, post, { tenantId, postId, subscriberId, email }),
    );
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.SEND_FAILED, {
      tenantId,
      postId,
      subscriberId,
      error: sanitizeLogMessage(error),
    });
    return;
  }
  await recordEmailSend(tenantId, EMAIL_TYPE.NEWSLETTER_ISSUE);
}
