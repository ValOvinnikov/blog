import 'server-only';

import {
  NEWSLETTER_POST_SEND_PATH,
  STUDIO_NEWSLETTER_LOG,
} from '@platform/constants/studio-newsletter';
import {
  readNewsletterPostSend,
  type TNewsletterPostSendRequest,
} from '@platform/server/newsletter-post-send/read-newsletter-post-send';
import {
  isWorkerRequestFailure,
  sendWorkerRequest,
} from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import { toSendNowRefusal } from '@platform/utils/newsletter-send-now-eligibility/newsletter-send-now-eligibility';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
  type TNewsletterSendNowRefusal,
  type TNewsletterSendNowResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TNewsletterPostHandStart } from '@shinefold/db/queries/newsletter-post-sends';

const refused = (
  reason: TNewsletterSendNowRefusal,
): TNewsletterSendNowResult => ({ outcome: ACTION_OUTCOME.REFUSED, reason });

const enqueuePostSend = async (
  tenantId: string,
  postId: string,
  claimedAt: Date,
): Promise<boolean> => {
  const response = await sendWorkerRequest(
    NEWSLETTER_POST_SEND_PATH,
    { tenantId, postId, claimedAt: claimedAt.toISOString() },
    { secretName: 'WORKER_NEWSLETTER_ENQUEUE_SECRET' },
  );
  if (isWorkerRequestFailure(response)) {
    const { failureEvent, failure } = response;
    logger.error(failureEvent, { tenantId, postId, ...failure });
    return false;
  }
  if (response.status === HTTP_STATUS.ACCEPTED) return true;

  logger.error(STUDIO_NEWSLETTER_LOG.SEND_NOW_ENQUEUE_REFUSED, {
    tenantId,
    postId,
    status: response.status,
  });
  return false;
};

const undoHandStart = async (
  tenantId: string,
  postId: string,
  {
    claimedAt,
    clearedSkipReason,
    clearedEmailsNeeded,
    clearedAllowanceLeft,
  }: TNewsletterPostHandStart,
): Promise<void> => {
  if (!clearedSkipReason) {
    await queries.newsletterPostSends.releaseNewsletterPostSend(
      tenantId,
      postId,
      claimedAt,
    );
    return;
  }
  await queries.newsletterPostSends.markNewsletterPostSkipped(
    tenantId,
    postId,
    clearedSkipReason,
    { emailsNeeded: clearedEmailsNeeded, allowanceLeft: clearedAllowanceLeft },
  );
};

export const startNewsletterPostSendNow = async (
  tenant: TPlatformTenant,
  request: TNewsletterPostSendRequest,
): Promise<TNewsletterSendNowResult> => {
  const { id: tenantId } = tenant;
  const { postId } = request;
  const { claim, sendNow } = await readNewsletterPostSend(tenant, request);
  const refusal = toSendNowRefusal(claim, sendNow);
  if (refusal) return refused(refusal);

  const started =
    await queries.newsletterPostSends.startNewsletterPostSendByHand(
      tenantId,
      postId,
    );
  if (!started) return refused(NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT);

  if (await enqueuePostSend(tenantId, postId, started.claimedAt)) {
    return { outcome: ACTION_OUTCOME.SUCCESS };
  }
  await undoHandStart(tenantId, postId, started);
  return refused(NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED);
};
