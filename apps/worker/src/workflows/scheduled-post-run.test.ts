import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post';
import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { fakeRunHook } from '@worker/testing/workflow/run-hook';
import { reportRunFailed } from '@worker/units/report-run-failed';
import { checkScheduledPost } from '@worker/units/scheduled-post/check-scheduled-post';
import { createHook, sleep } from 'workflow';

import { runAtScheduledPostDate } from './scheduled-post-run';

vi.mock('@worker/units/scheduled-post/check-scheduled-post');
vi.mock('@worker/units/report-run-failed');
vi.mock('workflow');

const MOCK_HOOK_PREFIX = 'scheduled-run:';
const MOCK_SCHEDULED = {
  state: SCHEDULED_POST_STATE.SCHEDULED,
  waitMs: SCHEDULED_POST_RECHECK_MS,
} as const;

const onDue = vi.fn();

function runAtDate() {
  return runAtScheduledPostDate({
    hookPrefix: MOCK_HOOK_PREFIX,
    runFailedEvent: SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
    tenantId: MOCK_TENANT_ID,
    postId: MOCK_POST_ID,
    publishedAt: MOCK_PUBLISHED_AT,
    onDue,
  });
}

describe(runAtScheduledPostDate, () => {
  let hook: ReturnType<typeof fakeRunHook>;

  beforeEach(() => {
    hook = fakeRunHook();
    vi.mocked(sleep).mockResolvedValue(undefined);
    onDue.mockResolvedValue(undefined);
  });

  it('sleeps until the publish time, then runs its work once', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.DUE });

    await runAtDate();

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(SCHEDULED_POST_RECHECK_MS);
    expect(onDue).toHaveBeenCalledOnce();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('holds the post run and works at once when its date has passed', async () => {
    vi.mocked(checkScheduledPost).mockResolvedValueOnce({
      state: SCHEDULED_POST_STATE.DUE,
    });

    await runAtDate();

    expect(sleep).not.toHaveBeenCalled();
    expect(onDue).toHaveBeenCalledOnce();
    expect(createHook).toHaveBeenCalledWith({
      token: `${MOCK_HOOK_PREFIX}${MOCK_TENANT_ID}:${MOCK_POST_ID}:${MOCK_PUBLISHED_AT}`,
    });
  });

  it('ends without its work when the post went stale while it slept', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.STALE });

    await runAtDate();

    expect(onDue).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('ends at once when another run already holds this publish time', async () => {
    hook = fakeRunHook(true);

    await runAtDate();

    expect(checkScheduledPost).not.toHaveBeenCalled();
    expect(onDue).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('reports a run that fails after its retries, then rethrows', async () => {
    vi.mocked(checkScheduledPost).mockResolvedValue({
      state: SCHEDULED_POST_STATE.DUE,
    });
    onDue.mockRejectedValue(new Error(MOCK_WORKFLOW_CRASH));

    await expect(runAtDate()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
    expect(reportRunFailed).toHaveBeenCalledExactlyOnceWith(
      SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );
    expect(hook.dispose).toHaveBeenCalled();
  });
});
