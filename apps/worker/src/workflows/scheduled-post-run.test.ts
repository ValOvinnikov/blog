import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post';
import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import {
  MOCK_EARLIER_PUBLISHED_AT,
  MOCK_LATER_PUBLISHED_AT,
  MOCK_PUBLISHED_AT,
} from '@worker/testing/scheduled-post/fixtures';
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

function runAtDate(isRedateFollowed = false) {
  return runAtScheduledPostDate({
    hookPrefix: MOCK_HOOK_PREFIX,
    runFailedEvent: SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
    tenantId: MOCK_TENANT_ID,
    postId: MOCK_POST_ID,
    publishedAt: MOCK_PUBLISHED_AT,
    isRedateFollowed,
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
    expect(onDue).toHaveBeenCalledExactlyOnceWith(MOCK_PUBLISHED_AT);
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('holds the post run and works at once when its date has passed', async () => {
    vi.mocked(checkScheduledPost).mockResolvedValueOnce({
      state: SCHEDULED_POST_STATE.DUE,
    });

    await runAtDate();

    expect(sleep).not.toHaveBeenCalled();
    expect(onDue).toHaveBeenCalledExactlyOnceWith(MOCK_PUBLISHED_AT);
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

  it('ends without its work when the post was re-dated and redates are not followed', async () => {
    vi.mocked(checkScheduledPost).mockResolvedValueOnce({
      state: SCHEDULED_POST_STATE.REDATED,
      publishedAt: MOCK_LATER_PUBLISHED_AT,
    });

    await runAtDate();

    expect(checkScheduledPost).toHaveBeenCalledOnce();
    expect(onDue).not.toHaveBeenCalled();
  });

  it('follows a date moved later and works once at the new date', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce({
        state: SCHEDULED_POST_STATE.REDATED,
        publishedAt: MOCK_LATER_PUBLISHED_AT,
      })
      .mockResolvedValueOnce(MOCK_SCHEDULED)
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.DUE });

    await runAtDate(true);

    expect(checkScheduledPost).toHaveBeenLastCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_LATER_PUBLISHED_AT,
    );
    expect(sleep).toHaveBeenCalledOnce();
    expect(onDue).toHaveBeenCalledExactlyOnceWith(MOCK_LATER_PUBLISHED_AT);
    expect(createHook).toHaveBeenCalledWith({
      token: `${MOCK_HOOK_PREFIX}${MOCK_TENANT_ID}:${MOCK_POST_ID}:${MOCK_PUBLISHED_AT}`,
    });
  });

  it('works at once with the new date when the post was moved to a passed date', async () => {
    vi.mocked(checkScheduledPost)
      .mockResolvedValueOnce({
        state: SCHEDULED_POST_STATE.REDATED,
        publishedAt: MOCK_EARLIER_PUBLISHED_AT,
      })
      .mockResolvedValueOnce({ state: SCHEDULED_POST_STATE.DUE });

    await runAtDate(true);

    expect(sleep).not.toHaveBeenCalled();
    expect(onDue).toHaveBeenCalledExactlyOnceWith(MOCK_EARLIER_PUBLISHED_AT);
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
