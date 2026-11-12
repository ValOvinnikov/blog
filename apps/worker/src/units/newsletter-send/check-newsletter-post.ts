import { CAPABILITY } from '@blog/config/constants';
import { PLAN_REGISTRY, WRITABLE_TENANT_STATUSES } from '@blog/db/constants';
import { getEmailNewPosts } from '@blog/db/queries/email-config';
import { getSettingsFeatures } from '@blog/db/queries/settings-features';
import {
  getTenantById,
  getTenantSanityCredentials,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { isOneOf } from '@blog/utils/primitives';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SCHEDULE_RECHECK_MS,
  NEWSLETTER_UNIT_MAX_RETRIES,
} from '@worker/constants/newsletter-send';
import {
  readNewsletterPost,
  type TNewsletterPost,
} from '@worker/utils/newsletter-send/read-newsletter-post';

export type TNewsletterPostCheck =
  | { state: typeof NEWSLETTER_POST_STATE.READY; post: TNewsletterPost }
  | { state: typeof NEWSLETTER_POST_STATE.SCHEDULED; waitMs: number }
  | { state: typeof NEWSLETTER_POST_STATE.CANCELLED };

const CANCELLED: TNewsletterPostCheck = {
  state: NEWSLETTER_POST_STATE.CANCELLED,
};

async function isSiteSendingPosts(tenant: TTenant): Promise<boolean> {
  const { id, status, plan } = tenant;
  if (!isOneOf(WRITABLE_TENANT_STATUSES, status)) return false;
  if (!PLAN_REGISTRY[plan].includes(CAPABILITY.NEWSLETTER)) return false;

  const [features, isEmailNewPostsOn] = await Promise.all([
    getSettingsFeatures(id),
    getEmailNewPosts(id),
  ]);
  return features?.newsletterEnabled === true && isEmailNewPostsOn;
}

export async function checkNewsletterPost(
  tenantId: string,
  postId: string,
): Promise<TNewsletterPostCheck> {
  'use step';

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
        waitMs: Math.min(waitMs, NEWSLETTER_SCHEDULE_RECHECK_MS),
      }
    : { state: NEWSLETTER_POST_STATE.READY, post };
}

checkNewsletterPost.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
