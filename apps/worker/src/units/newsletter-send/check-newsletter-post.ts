import { getNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends';
import {
  getTenantById,
  getTenantSanityCredentials,
} from '@blog/db/queries/tenants';
import { isUndefined } from '@blog/utils/primitives';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_UNIT_MAX_RETRIES,
} from '@worker/constants/newsletter-send';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { isSiteSendingPosts } from '@worker/utils/newsletter-send/is-site-sending-posts';
import {
  readNewsletterPost,
  type TNewsletterPost,
} from '@worker/utils/newsletter-send/read-newsletter-post';

export type TNewsletterPostCheck =
  | { state: typeof NEWSLETTER_POST_STATE.READY; post: TNewsletterPost }
  | { state: typeof NEWSLETTER_POST_STATE.SCHEDULED; waitMs: number }
  | { state: typeof NEWSLETTER_POST_STATE.CANCELLED }
  | { state: typeof NEWSLETTER_POST_STATE.UNCLAIMED };

const CANCELLED: TNewsletterPostCheck = {
  state: NEWSLETTER_POST_STATE.CANCELLED,
};

async function isClaimStillOpen(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<boolean> {
  const claim = await getNewsletterPostSend(tenantId, postId);
  return (
    !!claim &&
    isUndefined(claim.outcome) &&
    claim.claimedAt.getTime() === Date.parse(claimedAt)
  );
}

export async function checkNewsletterPost(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<TNewsletterPostCheck> {
  'use step';

  if (!(await isClaimStillOpen(tenantId, postId, claimedAt))) {
    return { state: NEWSLETTER_POST_STATE.UNCLAIMED };
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant || !(await isSiteSendingPosts(tenant))) return CANCELLED;

  const credentials = await getTenantSanityCredentials(tenantId);
  if (!credentials) return CANCELLED;

  const post = await readNewsletterPost(credentials, postId);
  if (!post?.isSendToSubscribersOn) return CANCELLED;

  const waitMs = Date.parse(post.publishedAt) - Date.now();
  return waitMs > 0
    ? {
        state: NEWSLETTER_POST_STATE.SCHEDULED,
        waitMs: Math.min(waitMs, SCHEDULED_POST_RECHECK_MS),
      }
    : { state: NEWSLETTER_POST_STATE.READY, post };
}

checkNewsletterPost.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
