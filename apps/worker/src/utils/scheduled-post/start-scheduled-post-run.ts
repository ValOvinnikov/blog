import { HTTP_STATUS } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SCHEDULED_POST_GRACE_MS } from '@worker/constants/scheduled-post';
import type { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import type { SCHEDULED_POST_SKIM_LOG } from '@worker/constants/scheduled-post-skim';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  refuseUnreadableTenant,
  respond,
  respondError,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { start } from 'workflow/api';
import { z } from 'zod';

type TScheduledPostWorkflow = (
  tenantId: string,
  postId: string,
  publishedAt: string,
) => Promise<void>;

type TStartFailedEvent =
  | typeof SCHEDULED_POST_PURGE_LOG.START_FAILED
  | typeof SCHEDULED_POST_SKIM_LOG.START_FAILED;

const scheduledPostBodySchema = tenantRequestBodySchema.extend({
  postId: z.string().min(1),
  publishedAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .refine((date) => date.getTime() > Date.now() - SCHEDULED_POST_GRACE_MS),
});

export async function startScheduledPostRun(
  request: Request,
  workflow: TScheduledPostWorkflow,
  startFailedEvent: TStartFailedEvent,
): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    scheduledPostBodySchema,
    env.WORKER_NEWSLETTER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, postId, publishedAt } = signed.data;

  try {
    const refusal = await refuseUnreadableTenant(tenantId);
    if (refusal) return refusal;

    const run = await start(workflow, [
      tenantId,
      postId,
      publishedAt.toISOString(),
    ]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(startFailedEvent, {
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
