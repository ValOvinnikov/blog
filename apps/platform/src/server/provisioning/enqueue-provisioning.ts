import { HTTP_METHOD, type TMaybeNull } from '@blog/config';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

const PROVISION_PATH = '/api/provision';
// Twice the platform's other outbound calls: the worker admits the row and starts the run before it answers.
const ENQUEUE_TIMEOUT_MS = 10_000;

/** Never throws: a missing worker URL or secret, or a network failure, is logged and returns `null`; any response returns its status. */
export const enqueueProvisioning = async (
  tenantId: string,
): Promise<TMaybeNull<number>> => {
  const workerUrl = env.WORKER_ENQUEUE_URL;
  const secret = env.WORKER_ENQUEUE_SECRET;

  if (!workerUrl || !secret) {
    logger.error('provisioning.enqueue_skipped', {
      tenantId,
      hasWorkerUrl: Boolean(workerUrl),
      hasSecret: Boolean(secret),
    });
    return null;
  }

  const url = new URL(PROVISION_PATH, workerUrl);
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
    logger.error('provisioning.enqueue_error', { tenantId, error });
    return null;
  }
};
