import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post-purge';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post-purge/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { fakeRunHook } from '@worker/testing/workflow/run-hook';
import { checkScheduledPost } from '@worker/units/scheduled-post-purge/check-scheduled-post';
import { purgeScheduledPostPages } from '@worker/units/scheduled-post-purge/purge-scheduled-post-pages';
import { reportScheduledPostPurgeFailed } from '@worker/units/scheduled-post-purge/report-scheduled-post-purge-failed';
import { sleep } from 'workflow';

import { purgeScheduledPost } from './purge-scheduled-post';

vi.mock('@worker/units/scheduled-post-purge/check-scheduled-post');
vi.mock('@worker/units/scheduled-post-purge/purge-scheduled-post-pages');
vi.mock(
  '@worker/units/scheduled-post-purge/report-scheduled-post-purge-failed',
);
vi.mock('workflow');

const MOCK_SCHEDULED = {
  state: SCHEDULED_POST_STATE.SCHEDULED,
  waitMs: SCHEDULED_POST_RECHECK_MS,
} as const;

function runPurge() {
  return purgeScheduledPost(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_PUBLISHED_AT);
}

describe(purgeScheduledPost, () => {
  let hook: ReturnType<typeof fakeRunHook>;

  beforeEach(() => {
    hook = fakeRunHook();
    vi.mocked(sleep).mockResolvedValue(undefined);
  });

  it('sleeps until the publish time, then purges the post once', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.DUE });

    await runPurge();

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(SCHEDULED_POST_RECHECK_MS);
    expect(purgeScheduledPostPages).toHaveBeenCalledOnce();
    expect(purgeScheduledPostPages).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
    );
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('ends without a purge when the post went stale while it slept', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.STALE });

    await runPurge();

    expect(purgeScheduledPostPages).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('ends at once when another run already holds this publish time', async () => {
    hook = fakeRunHook(true);

    await runPurge();

    expect(checkScheduledPost).not.toHaveBeenCalled();
    expect(purgeScheduledPostPages).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('reports a run that fails after its retries, then rethrows', async () => {
    vi.mocked(checkScheduledPost).mockResolvedValue({
      state: SCHEDULED_POST_STATE.DUE,
    });
    vi.mocked(purgeScheduledPostPages).mockRejectedValue(
      new Error(MOCK_WORKFLOW_CRASH),
    );

    await expect(runPurge()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
    expect(reportScheduledPostPurgeFailed).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );
    expect(hook.dispose).toHaveBeenCalled();
  });
});
