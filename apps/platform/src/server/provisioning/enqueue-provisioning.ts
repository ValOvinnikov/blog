import { HTTP_METHOD, type TMaybeNull } from '@blog/config';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import { WORKER_LOG } from '@platform/constants/worker';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

const PROVISION_PATH = '/api/provision';
// Twice the platform's other outbound calls: the worker admits the row and starts the run before it answers.
const ENQUEUE_TIMEOUT_MS = 10_000;

/** Never throws: a missing worker URL or secret, or a network failure, is logged and returns `null`; any response returns its status. */
export const enqueueWorkerRequest = async (
  path: string,
  tenantId: string,
): Promise<TMaybeNull<number>> => {
  const workerUrl = env.WORKER_ENQUEUE_URL;
  const secret = env.WORKER_ENQUEUE_SECRET;

  if (!workerUrl || !secret) {
    logger.error(WORKER_LOG.ENQUEUE_SKIPPED, {
      tenantId,
      path,
      hasWorkerUrl: Boolean(workerUrl),
      hasSecret: Boolean(secret),
    });
    return null;
  }

  const url = new URL(path, workerUrl);
  const rawBody = JSON.stringify({ tenantId });

  try {
    const response = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
        ...buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
      },
      body: rawBody,
      signal: AbortSignal.timeout(ENQUEUE_TIMEOUT_MS),
    });
    return response.status;
  } catch (error) {
    logger.error(WORKER_LOG.ENQUEUE_ERROR, {
      tenantId,
      path,
      ...toLoggableError(error),
    });
    return null;
  }
};

export const enqueueProvisioning = (
  tenantId: string,
): Promise<TMaybeNull<number>> =>
  enqueueWorkerRequest(PROVISION_PATH, tenantId);
