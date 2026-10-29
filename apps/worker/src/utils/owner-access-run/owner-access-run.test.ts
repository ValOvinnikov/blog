import {
  OWNER_ACCESS_HOOK_TOKEN_PREFIX,
  OWNER_ACCESS_RUN_CHECKS,
  OWNER_ACCESS_STALE_RUN_AFTER_MS,
  OWNER_ACCESS_STALE_RUN_CANCEL_REASON,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { WORKFLOW_RUN_STATUS } from '@worker/constants/workflow';
import { freezeClock, MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import {
  getHookByToken,
  getRun,
  type Hook,
  resumeHook,
  type Run,
  start,
} from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

import { wakeOwnerAccess } from './owner-access-run';

vi.mock('@worker/workflows/ensure-owner-access');
vi.mock('workflow/api');

const MOCK_HOOK_TOKEN = `${OWNER_ACCESS_HOOK_TOKEN_PREFIX}${MOCK_TENANT_ID}`;
const MOCK_COMPLETED_STATUS = 'completed';
const MOCK_STALE_CREATED_AT = new Date(
  MOCK_NOW.getTime() - OWNER_ACCESS_STALE_RUN_AFTER_MS,
);

function liveRun(
  createdAt: Date,
  status: string = WORKFLOW_RUN_STATUS.RUNNING,
) {
  const run = {
    status: Promise.resolve(status),
    createdAt: Promise.resolve(createdAt),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(getHookByToken).mockResolvedValue({
    runId: MOCK_RUN_ID,
  } as unknown as Hook);
  vi.mocked(getRun).mockReturnValue(run as unknown as Run<unknown>);
  return run;
}

describe(wakeOwnerAccess, () => {
  beforeEach(() => {
    freezeClock();
    vi.mocked(getHookByToken).mockRejectedValue(
      new HookNotFoundError(MOCK_HOOK_TOKEN),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('wakes the run already checking the tenant', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(resumeHook).toHaveBeenCalledWith(MOCK_HOOK_TOKEN, null);
    expect(start).not.toHaveBeenCalled();
  });

  describe('when no run is checking the tenant', () => {
    beforeEach(() => {
      vi.mocked(resumeHook).mockRejectedValue(
        new HookNotFoundError(MOCK_HOOK_TOKEN),
      );
    });

    it('starts a run making the full set of checks', async () => {
      await wakeOwnerAccess(MOCK_TENANT_ID);

      expect(start).toHaveBeenCalledWith(ensureOwnerAccess, [
        MOCK_TENANT_ID,
        OWNER_ACCESS_RUN_CHECKS,
      ]);
    });

    it('starts a run making the checks it was asked for', async () => {
      await wakeOwnerAccess(MOCK_TENANT_ID, OWNER_ACCESS_SWEEP_CHECKS);

      expect(start).toHaveBeenCalledWith(ensureOwnerAccess, [
        MOCK_TENANT_ID,
        OWNER_ACCESS_SWEEP_CHECKS,
      ]);
    });

    it('cancels a run old enough to be on an earlier deployment first', async () => {
      const run = liveRun(MOCK_STALE_CREATED_AT);

      await wakeOwnerAccess(MOCK_TENANT_ID);

      expect(getRun).toHaveBeenCalledWith(MOCK_RUN_ID);
      expect(run.cancel).toHaveBeenCalledWith({
        cancelReason: OWNER_ACCESS_STALE_RUN_CANCEL_REASON,
      });
      expect(start).toHaveBeenCalled();
    });
  });

  it('starts a fresh run after cancelling a stale one, even while its hook still answers', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);
    const run = liveRun(MOCK_STALE_CREATED_AT);

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(run.cancel).toHaveBeenCalled();
    expect(resumeHook).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith(ensureOwnerAccess, [
      MOCK_TENANT_ID,
      OWNER_ACCESS_RUN_CHECKS,
    ]);
  });

  it('leaves a recent run alone', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);
    const run = liveRun(new Date(MOCK_STALE_CREATED_AT.getTime() + 1));

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(run.cancel).not.toHaveBeenCalled();
  });

  it('leaves a run that has already ended alone', async () => {
    vi.mocked(resumeHook).mockRejectedValue(
      new HookNotFoundError(MOCK_HOOK_TOKEN),
    );
    const run = liveRun(MOCK_STALE_CREATED_AT, MOCK_COMPLETED_STATUS);

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(run.cancel).not.toHaveBeenCalled();
  });

  it('starts nothing when waking fails for another reason', async () => {
    vi.mocked(resumeHook).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await expect(wakeOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_QUEUE_DOWN,
    );
    expect(start).not.toHaveBeenCalled();
  });

  it('starts nothing when the run lookup fails', async () => {
    vi.mocked(getHookByToken).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await expect(wakeOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_QUEUE_DOWN,
    );
    expect(resumeHook).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });
});
