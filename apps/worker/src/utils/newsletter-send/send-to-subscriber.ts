import type { IActiveSubscriber } from '@blog/db/queries/subscribers';
import { isRetryableSendError, sendEmail } from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import { hasLength } from '@blog/utils/primitives';
import {
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SUBSCRIBER_SEND,
  type TNewsletterSubscriberSend,
} from '@worker/constants/newsletter-send';
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
): Promise<TNewsletterSubscriberSend> {
  if (!email) return NEWSLETTER_SUBSCRIBER_SEND.UNREADABLE;

  try {
    await sendEmail(
      buildPostSend(context, post, { tenantId, postId, subscriberId, email }),
    );
    return NEWSLETTER_SUBSCRIBER_SEND.SENT;
  } catch (error) {
    if (isRetryableSendError(error)) throw error;
    logger.error(NEWSLETTER_SEND_LOG.SEND_FAILED, {
      tenantId,
      postId,
      subscriberId,
      error: sanitizeLogMessage(error),
    });
    return NEWSLETTER_SUBSCRIBER_SEND.REJECTED;
  }
}
