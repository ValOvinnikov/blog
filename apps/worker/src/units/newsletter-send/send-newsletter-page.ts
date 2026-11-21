import { setTimeout as wait } from 'node:timers/promises';

import { NEWSLETTER_SKIP_REASON } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  setNewsletterPostSendProgress,
  markNewsletterPostSkipped,
} from '@shinefold/db/queries/newsletter-post-sends';
import { listActiveSubscribers } from '@shinefold/db/queries/subscribers';
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
import { loadNewsletterSendContext } from '@worker/utils/newsletter-send/newsletter-send-context';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';
import {
  assertPageReadable,
  sendToSubscriber,
} from '@worker/utils/newsletter-send/send-to-subscriber';
import { readPageStopReason } from '@worker/utils/newsletter-send/sending-off-cause';

export type TNewsletterPageInput = {
  tenantId: string;
  postId: string;
  claimedAt: string;
  post: TNewsletterPost;
  afterId: TMaybeUndefined<string>;
  reachedBefore: number;
};

export type TNewsletterPageResult = {
  pace: TNewsletterSendPace;
  lastId: TMaybeUndefined<string>;
  isLastPage: boolean;
  reachedCount: number;
  sentCount: number;
  unreadableCount: number;
};

export async function sendNewsletterPage(
  input: TNewsletterPageInput,
): Promise<TNewsletterPageResult> {
  'use step';

  const { tenantId, postId, claimedAt, afterId, reachedBefore } = input;
  const stopped = {
    pace: NEWSLETTER_SEND_PACE.STOPPED,
    lastId: afterId,
    isLastPage: true,
    reachedCount: reachedBefore,
    sentCount: 0,
    unreadableCount: 0,
  };
  const tenant = await loadTenant(tenantId);
  const stopReason = await readPageStopReason(tenantId);
  const pace = stopReason
    ? NEWSLETTER_SEND_PACE.STOPPED
    : await readReputationPace(tenant, { isOperatorAlerted: false });
  if (pace === NEWSLETTER_SEND_PACE.STOPPED) {
    await markNewsletterPostSkipped(
      tenantId,
      postId,
      stopReason ?? NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
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
  const reachedCount = reachedBefore + subscribers.length;
  await setNewsletterPostSendProgress(
    tenantId,
    postId,
    new Date(claimedAt),
    reachedCount,
  );

  return {
    pace,
    lastId: subscribers.at(-1)?.id ?? afterId,
    isLastPage: subscribers.length < NEWSLETTER_SEND_PAGE_SIZE,
    reachedCount,
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
