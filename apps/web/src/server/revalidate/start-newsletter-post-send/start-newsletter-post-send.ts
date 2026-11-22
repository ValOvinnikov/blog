import {
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { queries } from '@shinefold/db';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueNewsletterPostSend } from '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { logger } from '@web/utils/logger/logger';

/** Resolves the claim's time only when the site sends posts: a site not sending records why on the claim and keeps it, so a later republish emails nothing. */
const claimFirstPublish = async (
  tenantId: string,
  postId: string,
): Promise<TMaybeUndefined<Date>> => {
  const offCause =
    await queries.newsletterPostSends.getNewsletterSendingOffCause(tenantId);
  if (!offCause.ok) return undefined;

  const claim = await queries.newsletterPostSends.claimNewsletterPostSend(
    tenantId,
    postId,
  );
  if (!claim) return undefined;
  if (!offCause.data) return claim.claimedAt;

  await queries.newsletterPostSends.markNewsletterPostSkipped(
    tenantId,
    postId,
    offCause.data,
  );
  return undefined;
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

  const claimedAt = await claimFirstPublish(tenantId, postId).catch(
    (error: unknown) => {
      logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_START_FAILED, {
        tenantId,
        postId,
        error,
      });
      return undefined;
    },
  );
  if (!claimedAt) return;

  const isStarted = await enqueueNewsletterPostSend({
    tenantId,
    postId,
    claimedAt: claimedAt.toISOString(),
  });
  if (!isStarted) await releaseClaim(tenantId, postId, claimedAt);
};
