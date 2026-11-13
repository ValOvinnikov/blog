import { HTTP_METHOD } from '@blog/config/constants';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import {
  SCHEDULED_POST_PURGE_TIMEOUT_MS,
  WEB_SCHEDULED_POST_PURGE_PATH,
} from '@worker/constants/scheduled-post-purge';
import { env } from '@worker/utils/env/env';
import { FatalError } from 'workflow';

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
  if (!response.ok) {
    throw new Error(
      `Scheduled post purge failed for tenant "${tenantId}": ${response.status}`,
    );
  }
}
