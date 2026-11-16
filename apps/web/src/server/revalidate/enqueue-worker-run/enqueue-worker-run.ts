import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

// The worker reads the tenant and starts the run before it answers.
const ENQUEUE_TIMEOUT_MS = 10_000;

export type TWorkerRunRequest = { tenantId: string; postId: string };

export type TEnqueueWorkerRunInput<TRequest extends TWorkerRunRequest> = {
  path: string;
  request: TRequest;
  log: { SKIPPED: string; REFUSED: string; FAILED: string };
};

/** Never throws: resolves whether the worker started the run, logging why when it did not. */
export const enqueueWorkerRun = async <TRequest extends TWorkerRunRequest>({
  path,
  request,
  log,
}: TEnqueueWorkerRunInput<TRequest>): Promise<boolean> => {
  const { tenantId, postId } = request;
  const workerUrl = env.WORKER_ENQUEUE_URL;
  const secret = env.WORKER_NEWSLETTER_ENQUEUE_SECRET;

  if (!workerUrl || !secret) {
    logger.error(log.SKIPPED, {
      tenantId,
      postId,
      hasWorkerUrl: Boolean(workerUrl),
      hasSecret: Boolean(secret),
    });
    return false;
  }

  const url = new URL(path, workerUrl);
  const rawBody = JSON.stringify(request);

  try {
    const { status } = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
      body: rawBody,
      signal: AbortSignal.timeout(ENQUEUE_TIMEOUT_MS),
    });
    if (status === HTTP_STATUS.ACCEPTED) return true;

    logger.error(log.REFUSED, { tenantId, postId, status });
    return false;
  } catch (error) {
    logger.error(log.FAILED, { tenantId, postId, error });
    return false;
  }
};
