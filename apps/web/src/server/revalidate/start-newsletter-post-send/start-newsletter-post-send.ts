import { CAPABILITY, SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  REVALIDATE_LOG,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueNewsletterPostSend } from '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { isCapabilityEnabledForTenant } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

const isSiteSendingPosts = async (tenantId: string): Promise<boolean> => {
  const [isNewsletterOn, isEmailNewPostsOn] = await Promise.all([
    isCapabilityEnabledForTenant(tenantId, CAPABILITY.NEWSLETTER),
    queries.emailConfig.getEmailNewPosts(tenantId),
  ]);
  return isNewsletterOn && isEmailNewPostsOn;
};

const releaseClaim = async (
  tenantId: string,
  postId: string,
  claimedAt: Date,
): Promise<void> => {
  try {
    await queries.newsletterPostSends.releaseNewsletterPostSend(
      tenantId,
      postId,
      claimedAt,
    );
  } catch (error) {
    logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_RELEASE_FAILED, {
      tenantId,
      postId,
      error,
    });
  }
};

// Only `create` can be a first publish: an edit arrives as `update`, and a republish's `create` finds the claim already taken.
export const startNewsletterPostSend = async ({
  operation,
  type,
  id: postId,
  tenantId,
}: TPostWebhookEvent): Promise<void> => {
  if (
    operation !== SANITY_WEBHOOK_OPERATION.CREATE ||
    type !== POST_TYPE ||
    postId.startsWith(STARTER_DOCUMENT_ID_PREFIX) ||
    !tenantId
  ) {
    return;
  }

  let claim;
  let isSending;
  try {
    const tenant = await queries.tenants.getTenantById(tenantId);
    if (!tenant || !isTenantActive(tenant)) return;

    isSending = await isSiteSendingPosts(tenantId);
    claim = await queries.newsletterPostSends.claimNewsletterPostSend(
      tenantId,
      postId,
    );
  } catch (error) {
    logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_START_FAILED, {
      tenantId,
      postId,
      error,
    });
    return;
  }
  // A site not sending keeps the claim, so a republish once sending is on never emails an old post.
  if (!claim || !isSending) return;

  const { claimedAt } = claim;
  const isStarted = await enqueueNewsletterPostSend({
    tenantId,
    postId,
    claimedAt: claimedAt.toISOString(),
  });
  if (!isStarted) await releaseClaim(tenantId, postId, claimedAt);
};
