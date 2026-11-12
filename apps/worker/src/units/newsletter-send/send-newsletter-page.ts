import { setTimeout as wait } from 'node:timers/promises';

import { EMAIL_TYPE } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { NEWSLETTER_SKIP_REASON } from '@blog/db/constants';
import { recordEmailSend } from '@blog/db/queries/email-usage';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends';
import {
  listActiveSubscribers,
  type IActiveSubscriber,
} from '@blog/db/queries/subscribers';
import { sendEmail } from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import {
  NEWSLETTER_SEND_INTERVAL_MS,
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_UNIT_MAX_RETRIES,
  type TNewsletterSendPace,
} from '@worker/constants/newsletter-send';
import { loadTenant } from '@worker/units/run-reported-step';
import { logger } from '@worker/utils/logger/logger';
import { buildPostSend } from '@worker/utils/newsletter-send/build-post-send';
import {
  loadNewsletterSendContext,
  type TNewsletterSendContext,
} from '@worker/utils/newsletter-send/newsletter-send-context';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

export type TNewsletterPageInput = {
  tenantId: string;
  postId: string;
  post: TNewsletterPost;
  afterId: TMaybeUndefined<string>;
  pageSize: number;
};

export type TNewsletterPageResult = {
  pace: TNewsletterSendPace;
  lastId: TMaybeUndefined<string>;
  isLastPage: boolean;
};

async function sendToSubscriber(
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

export async function sendNewsletterPage(
  input: TNewsletterPageInput,
): Promise<TNewsletterPageResult> {
  'use step';

  const { tenantId, postId, afterId, pageSize } = input;
  const pace = await readReputationPace(await loadTenant(tenantId), {
    isWarningAlerted: false,
  });
  if (pace === NEWSLETTER_SEND_PACE.STOPPED) {
    await markNewsletterPostSkipped(
      tenantId,
      postId,
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    );
    return { pace, lastId: afterId, isLastPage: true };
  }

  const [context, subscribers] = await Promise.all([
    loadNewsletterSendContext(tenantId),
    listActiveSubscribers(tenantId, pageSize, afterId),
  ]);
  for (const [index, subscriber] of subscribers.entries()) {
    if (index > 0) await wait(NEWSLETTER_SEND_INTERVAL_MS);
    await sendToSubscriber(input, context, subscriber);
  }

  return {
    pace,
    lastId: subscribers.at(-1)?.id ?? afterId,
    isLastPage: subscribers.length < pageSize,
  };
}

sendNewsletterPage.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
