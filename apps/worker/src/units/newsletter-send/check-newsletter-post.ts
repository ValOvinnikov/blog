import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  getNewsletterPostSend,
  getNewsletterSendingOffCause,
  type INewsletterPostSend,
  markNewsletterPostSkipped,
  setNewsletterPostSendSchedule,
} from '@shinefold/db/queries/newsletter-post-sends';
import { getTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { isUndefined } from '@shinefold/utils/primitives';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_UNIT_MAX_RETRIES,
} from '@worker/constants/newsletter-send';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import {
  readNewsletterPost,
  type TNewsletterPost,
} from '@worker/utils/newsletter-send/read-newsletter-post';
import { isOffCauseRecorded } from '@worker/utils/newsletter-send/sending-off-cause';

export type TNewsletterPostCheck =
  | { state: typeof NEWSLETTER_POST_STATE.READY; post: TNewsletterPost }
  | { state: typeof NEWSLETTER_POST_STATE.SCHEDULED; waitMs: number }
  | { state: typeof NEWSLETTER_POST_STATE.CANCELLED }
  | { state: typeof NEWSLETTER_POST_STATE.SKIPPED }
  | { state: typeof NEWSLETTER_POST_STATE.UNCLAIMED };

const CANCELLED: TNewsletterPostCheck = {
  state: NEWSLETTER_POST_STATE.CANCELLED,
};

async function readOpenClaim(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<TMaybeUndefined<INewsletterPostSend>> {
  const claim = await getNewsletterPostSend(tenantId, postId);
  const isOpen =
    !!claim &&
    isUndefined(claim.outcome) &&
    claim.claimedAt.getTime() === Date.parse(claimedAt);
  return isOpen ? claim : undefined;
}

async function scheduleFor(
  tenantId: string,
  postId: string,
  { claimedAt, scheduledFor }: INewsletterPostSend,
  publishedAt: Date,
): Promise<void> {
  if (scheduledFor?.getTime() === publishedAt.getTime()) return;
  await setNewsletterPostSendSchedule(tenantId, postId, claimedAt, publishedAt);
}

export async function checkNewsletterPost(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<TNewsletterPostCheck> {
  'use step';

  const claim = await readOpenClaim(tenantId, postId, claimedAt);
  if (!claim) return { state: NEWSLETTER_POST_STATE.UNCLAIMED };

  const offCause = await getNewsletterSendingOffCause(tenantId);
  if (!offCause.ok) return CANCELLED;
  if (offCause.data) {
    if (!isOffCauseRecorded(offCause.data)) return CANCELLED;
    await markNewsletterPostSkipped(tenantId, postId, offCause.data);
    return { state: NEWSLETTER_POST_STATE.SKIPPED };
  }

  const credentials = await getTenantSanityCredentials(tenantId);
  if (!credentials) return CANCELLED;

  const post = await readNewsletterPost(credentials, postId);
  const isSwitchedOn = !!claim.handStartedAt || !!post?.isSendToSubscribersOn;
  if (!post || !isSwitchedOn) return CANCELLED;

  const publishedAt = new Date(post.publishedAt);
  const waitMs = publishedAt.getTime() - Date.now();
  if (waitMs <= 0) return { state: NEWSLETTER_POST_STATE.READY, post };

  await scheduleFor(tenantId, postId, claim, publishedAt);
  return {
    state: NEWSLETTER_POST_STATE.SCHEDULED,
    waitMs: Math.min(waitMs, SCHEDULED_POST_RECHECK_MS),
  };
}

checkNewsletterPost.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
