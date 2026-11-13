import { DAY_MS } from '@blog/db/constants';
import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post-purge';
import { readPostPublishedAt } from '@worker/utils/scheduled-post-purge/read-post-published-at';

export type TScheduledPostCheck =
  | { state: typeof SCHEDULED_POST_STATE.DUE }
  | { state: typeof SCHEDULED_POST_STATE.SCHEDULED; waitMs: number }
  | { state: typeof SCHEDULED_POST_STATE.STALE };

const STALE: TScheduledPostCheck = { state: SCHEDULED_POST_STATE.STALE };

export async function checkScheduledPost(
  tenantId: string,
  postId: string,
  publishedAt: string,
): Promise<TScheduledPostCheck> {
  'use step';

  const credentials = await getTenantSanityCredentials(tenantId);
  if (!credentials) return STALE;

  const currentPublishedAt = await readPostPublishedAt(credentials, postId);
  const publishAtMs = Date.parse(publishedAt);
  if (!currentPublishedAt || Date.parse(currentPublishedAt) !== publishAtMs) {
    return STALE;
  }

  const waitMs = publishAtMs - Date.now();
  return waitMs > 0
    ? {
        state: SCHEDULED_POST_STATE.SCHEDULED,
        waitMs: Math.min(waitMs, DAY_MS),
      }
    : { state: SCHEDULED_POST_STATE.DUE };
}
