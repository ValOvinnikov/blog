import { HTTP_STATUS } from '@blog/config/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  refuseUnreadableTenant,
  respond,
  respondError,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { purgeScheduledPost } from '@worker/workflows/purge-scheduled-post';
import { start } from 'workflow/api';
import { z } from 'zod';

const scheduledPostPurgeBodySchema = tenantRequestBodySchema.extend({
  postId: z.string().min(1),
  publishedAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .refine((date) => date.getTime() > Date.now()),
});

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    scheduledPostPurgeBodySchema,
    env.WORKER_NEWSLETTER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, postId, publishedAt } = signed.data;

  try {
    const refusal = await refuseUnreadableTenant(tenantId);
    if (refusal) return refusal;

    const run = await start(purgeScheduledPost, [
      tenantId,
      postId,
      publishedAt.toISOString(),
    ]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(SCHEDULED_POST_PURGE_LOG.START_FAILED, {
      tenantId,
      postId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
