import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post';
import type { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import type { SCHEDULED_POST_SKIM_LOG } from '@worker/constants/scheduled-post-skim';
import { reportRunFailed } from '@worker/units/report-run-failed';
import { checkScheduledPost } from '@worker/units/scheduled-post/check-scheduled-post';
import { errorMessage } from '@worker/utils/error-message/error-message';
import { createHook, sleep } from 'workflow';

export type TScheduledPostRun = {
  hookPrefix: string;
  runFailedEvent:
    | typeof SCHEDULED_POST_PURGE_LOG.RUN_FAILED
    | typeof SCHEDULED_POST_SKIM_LOG.RUN_FAILED;
  tenantId: string;
  postId: string;
  publishedAt: string;
  onDue: () => Promise<void>;
};

/** Callable only from a workflow, since it sleeps and holds a run hook. */
export async function runAtScheduledPostDate({
  hookPrefix,
  runFailedEvent,
  tenantId,
  postId,
  publishedAt,
  onDue,
}: TScheduledPostRun): Promise<void> {
  const run = createHook<null>({
    token: `${hookPrefix}${tenantId}:${postId}:${publishedAt}`,
  });
  try {
    if (await run.getConflict()) return;

    let check = await checkScheduledPost(tenantId, postId, publishedAt);
    while (check.state === SCHEDULED_POST_STATE.SCHEDULED) {
      await sleep(check.waitMs);
      check = await checkScheduledPost(tenantId, postId, publishedAt);
    }
    if (check.state === SCHEDULED_POST_STATE.DUE) {
      await onDue();
    }
  } catch (error) {
    await reportRunFailed(
      runFailedEvent,
      tenantId,
      postId,
      errorMessage(error),
    );
    throw error;
  } finally {
    run.dispose();
  }
}
