import { setTimeout as wait } from 'node:timers/promises';

import type { TMaybeUndefined } from '@blog/config/types';
import { NEWSLETTER_SKIP_REASON } from '@blog/db/constants';
import { getNewsletterPausedAt } from '@blog/db/queries/email-config';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends';
import { listActiveSubscribers } from '@blog/db/queries/subscribers';
import {
  NEWSLETTER_SEND_INTERVAL_MS,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SEND_PAGE_SIZE,
  NEWSLETTER_SUBSCRIBER_SEND,
  type TNewsletterSubscriberSend,
  NEWSLETTER_UNIT_MAX_RETRIES,
  type TNewsletterSendPace,
} from '@worker/constants/newsletter-send';
import { loadTenant } from '@worker/units/run-reported-step';
import { isSiteSendingPosts } from '@worker/utils/newsletter-send/is-site-sending-posts';
import { loadNewsletterSendContext } from '@worker/utils/newsletter-send/newsletter-send-context';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';
import {
  assertPageReadable,
  sendToSubscriber,
} from '@worker/utils/newsletter-send/send-to-subscriber';

export type TNewsletterPageInput = {
  tenantId: string;
  postId: string;
  post: TNewsletterPost;
  afterId: TMaybeUndefined<string>;
};

export type TNewsletterPageResult = {
  pace: TNewsletterSendPace;
  lastId: TMaybeUndefined<string>;
  isLastPage: boolean;
  sentCount: number;
  unreadableCount: number;
};

export async function sendNewsletterPage(
  input: TNewsletterPageInput,
): Promise<TNewsletterPageResult> {
  'use step';

  const { tenantId, postId, afterId } = input;
  const stopped = {
    pace: NEWSLETTER_SEND_PACE.STOPPED,
    lastId: afterId,
    isLastPage: true,
    sentCount: 0,
    unreadableCount: 0,
  };
  const tenant = await loadTenant(tenantId);
  if (
    (await getNewsletterPausedAt(tenantId)) ||
    !(await isSiteSendingPosts(tenant))
  ) {
    await markNewsletterPostSkipped(
      tenantId,
      postId,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );
    return stopped;
  }

  const pace = await readReputationPace(tenant, { isOperatorAlerted: false });
  if (pace === NEWSLETTER_SEND_PACE.STOPPED) {
    await markNewsletterPostSkipped(
      tenantId,
      postId,
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    );
    return stopped;
  }

  const [context, subscribers] = await Promise.all([
    loadNewsletterSendContext(tenantId),
    listActiveSubscribers(tenantId, NEWSLETTER_SEND_PAGE_SIZE, afterId),
  ]);
  assertPageReadable(input, subscribers);
  const sends: TNewsletterSubscriberSend[] = [];
  for (const [index, subscriber] of subscribers.entries()) {
    if (index > 0) await wait(NEWSLETTER_SEND_INTERVAL_MS);
    sends.push(await sendToSubscriber(input, context, subscriber));
  }

  return {
    pace,
    lastId: subscribers.at(-1)?.id ?? afterId,
    isLastPage: subscribers.length < NEWSLETTER_SEND_PAGE_SIZE,
    sentCount: countOf(sends, NEWSLETTER_SUBSCRIBER_SEND.SENT),
    unreadableCount: countOf(sends, NEWSLETTER_SUBSCRIBER_SEND.UNREADABLE),
  };
}

function countOf(
  sends: TNewsletterSubscriberSend[],
  outcome: TNewsletterSubscriberSend,
): number {
  return sends.filter((send) => send === outcome).length;
}

sendNewsletterPage.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
