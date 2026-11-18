import { getTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { readPostPublishedAt } from '@worker/utils/scheduled-post/read-post-published-at';

export type TScheduledPostCheck =
  | { state: typeof SCHEDULED_POST_STATE.DUE }
  | { state: typeof SCHEDULED_POST_STATE.SCHEDULED; waitMs: number }
  | { state: typeof SCHEDULED_POST_STATE.STALE }
  | { state: typeof SCHEDULED_POST_STATE.REDATED; publishedAt: string };

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
  if (!currentPublishedAt) return STALE;
  if (Date.parse(currentPublishedAt) !== publishAtMs) {
    return {
      state: SCHEDULED_POST_STATE.REDATED,
      publishedAt: currentPublishedAt,
    };
  }

  const waitMs = publishAtMs - Date.now();
  return waitMs > 0
    ? {
        state: SCHEDULED_POST_STATE.SCHEDULED,
        waitMs: Math.min(waitMs, SCHEDULED_POST_RECHECK_MS),
      }
    : { state: SCHEDULED_POST_STATE.DUE };
}
