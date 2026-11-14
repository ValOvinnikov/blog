import { HTTP_STATUS } from '@blog/config/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  NEWSLETTER_POST_ID_MAX_LENGTH,
  NEWSLETTER_SEND_LOG,
} from '@worker/constants/newsletter-send';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  refuseUnreadableTenant,
  respond,
  respondError,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { sendNewsletterPost } from '@worker/workflows/send-newsletter-post';
import { start } from 'workflow/api';
import { z } from 'zod';

const postSendBodySchema = tenantRequestBodySchema.extend({
  postId: z.string().min(1).max(NEWSLETTER_POST_ID_MAX_LENGTH),
  claimedAt: z.iso.datetime(),
});

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    postSendBodySchema,
    env.WORKER_NEWSLETTER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, postId, claimedAt } = signed.data;

  try {
    const refusal = await refuseUnreadableTenant(tenantId);
    if (refusal) return refusal;

    const run = await start(sendNewsletterPost, [tenantId, postId, claimedAt]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.START_FAILED, {
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
