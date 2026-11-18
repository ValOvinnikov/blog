import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';
import { SCHEDULED_POST_WEB_RETRYABLE_STATUSES } from '@worker/constants/scheduled-post';
import { env } from '@worker/utils/env/env';
import { readRetryAfter } from '@worker/utils/retry-after/retry-after';
import { FatalError, RetryableError } from 'workflow';

export type TScheduledPostWebCall = {
  path: string;
  body: Record<string, string> & { tenantId: string };
  timeoutMs: number;
  action: string;
};

function webFailure(response: Response, message: string): Error {
  const { status } = response;
  const isRetryable = SCHEDULED_POST_WEB_RETRYABLE_STATUSES.includes(status);
  const retryAfter = readRetryAfter(response);
  if (isRetryable && retryAfter) {
    return new RetryableError(message, { retryAfter });
  }
  const isRefused = status < HTTP_STATUS.INTERNAL_SERVER_ERROR && !isRetryable;
  return isRefused ? new FatalError(message) : new Error(message);
}

/** Throws a FatalError for a refusal web will repeat, and a retryable error otherwise. */
export async function postScheduledPostToWeb({
  path,
  body,
  timeoutMs,
  action,
}: TScheduledPostWebCall): Promise<void> {
  const webAppUrl = env.WEB_APP_URL;
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!webAppUrl || !secret) {
    throw new FatalError(
      `WEB_APP_URL and SANITY_REVALIDATE_SECRET must be set to ${action}.`,
    );
  }

  const url = new URL(path, webAppUrl);
  const rawBody = JSON.stringify(body);
  const response = await fetch(url, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
    body: rawBody,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.ok) return;

  throw webFailure(
    response,
    `Failed to ${action} for tenant "${body.tenantId}": ${response.status}`,
  );
}
