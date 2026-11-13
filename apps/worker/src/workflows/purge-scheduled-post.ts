import {
  SCHEDULED_POST_PURGE_HOOK_PREFIX,
  SCHEDULED_POST_STATE,
} from '@worker/constants/scheduled-post-purge';
import { checkScheduledPost } from '@worker/units/scheduled-post-purge/check-scheduled-post';
import { purgeScheduledPostPages } from '@worker/units/scheduled-post-purge/purge-scheduled-post-pages';
import { createHook, sleep } from 'workflow';

export async function purgeScheduledPost(
  tenantId: string,
  postId: string,
  publishedAt: string,
): Promise<void> {
  'use workflow';

  const run = createHook<null>({
    token: `${SCHEDULED_POST_PURGE_HOOK_PREFIX}${tenantId}:${postId}:${publishedAt}`,
  });
  try {
    if (await run.getConflict()) return;

    let check = await checkScheduledPost(tenantId, postId, publishedAt);
    while (check.state === SCHEDULED_POST_STATE.SCHEDULED) {
      await sleep(check.waitMs);
      check = await checkScheduledPost(tenantId, postId, publishedAt);
    }
    if (check.state === SCHEDULED_POST_STATE.DUE) {
      await purgeScheduledPostPages(tenantId, postId);
    }
  } finally {
    run.dispose();
  }
}
