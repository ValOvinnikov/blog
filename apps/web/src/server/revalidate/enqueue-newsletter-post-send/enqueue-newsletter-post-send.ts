import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

export const NEWSLETTER_POST_SEND_PATH = '/api/newsletter/post-send';
// The worker reads the tenant and starts the run before it answers.
const ENQUEUE_TIMEOUT_MS = 10_000;

export type TNewsletterPostSendRequest = {
  tenantId: string;
  postId: string;
  claimedAt: string;
};

/** Never throws: resolves whether the worker started the run, logging why when it did not. */
export const enqueueNewsletterPostSend = async (
  request: TNewsletterPostSendRequest,
): Promise<boolean> => {
  const { tenantId, postId } = request;
  const workerUrl = env.WORKER_ENQUEUE_URL;
  const secret = env.WORKER_ENQUEUE_SECRET;

  if (!workerUrl || !secret) {
    logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_SKIPPED, {
      tenantId,
      postId,
      hasWorkerUrl: Boolean(workerUrl),
      hasSecret: Boolean(secret),
    });
    return false;
  }

  const url = new URL(NEWSLETTER_POST_SEND_PATH, workerUrl);
  const rawBody = JSON.stringify(request);

  try {
    const { status } = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
      body: rawBody,
      signal: AbortSignal.timeout(ENQUEUE_TIMEOUT_MS),
    });
    if (status === HTTP_STATUS.ACCEPTED) return true;

    logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_REFUSED, {
      tenantId,
      postId,
      status,
    });
    return false;
  } catch (error) {
    logger.error(REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_FAILED, {
      tenantId,
      postId,
      error,
    });
    return false;
  }
};
