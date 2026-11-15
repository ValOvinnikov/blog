import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import {
  SCHEDULED_POST_PURGE_RETRYABLE_STATUSES,
  SCHEDULED_POST_PURGE_TIMEOUT_MS,
  WEB_SCHEDULED_POST_PURGE_PATH,
} from '@worker/constants/scheduled-post-purge';
import { env } from '@worker/utils/env/env';
import { readRetryAfter } from '@worker/utils/retry-after/retry-after';
import { FatalError, RetryableError } from 'workflow';

function purgeFailure(response: Response, tenantId: string): Error {
  const { status } = response;
  const message = `Scheduled post purge failed for tenant "${tenantId}": ${status}`;
  const retryAfter = readRetryAfter(response);
  if (SCHEDULED_POST_PURGE_RETRYABLE_STATUSES.includes(status) && retryAfter) {
    return new RetryableError(message, { retryAfter });
  }
  const isRefused =
    status < HTTP_STATUS.INTERNAL_SERVER_ERROR &&
    !SCHEDULED_POST_PURGE_RETRYABLE_STATUSES.includes(status);
  return isRefused ? new FatalError(message) : new Error(message);
}

export async function purgeScheduledPostPages(
  tenantId: string,
  postId: string,
): Promise<void> {
  'use step';

  const webAppUrl = env.WEB_APP_URL;
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!webAppUrl || !secret) {
    throw new FatalError(
      'WEB_APP_URL and SANITY_REVALIDATE_SECRET must be set to purge a scheduled post.',
    );
  }

  const url = new URL(WEB_SCHEDULED_POST_PURGE_PATH, webAppUrl);
  const rawBody = JSON.stringify({ tenantId, postId });
  const response = await fetch(url, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
    body: rawBody,
    signal: AbortSignal.timeout(SCHEDULED_POST_PURGE_TIMEOUT_MS),
  });
  if (response.ok) return;

  throw purgeFailure(response, tenantId);
}
