import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenantDeprovisioningState } from '@blog/db/schema/tenants';
import { getTenantDeprovisioningStatusAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';
import { act, fireEvent, renderHook } from '@platform/testing/custom-render';
import {
  mockDoneDeprovisioningSteps,
  mockIdleDeprovisioningSteps,
  mockClientTenant,
  MOCK_TENANT_ID,
  MOCK_RUN_STARTED_AT,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_4_MIN_AT,
} from '@platform/testing/tenants/fixtures';

import {
  MAX_POLL_TICKS,
  STEP_POLL_INTERVAL_MS,
  useDeprovisioningPoll,
} from './use-deprovisioning-poll';

const ENABLED = { isEnabled: true };
const MOCK_STEP_ERROR = 'Sanity Access API returned 403';

const { REMOVE_DOMAIN, ARCHIVE_SANITY_PROJECT, REVOKE_SANITY_TOKENS } =
  DEPROVISIONING_STEP;
const STEP_STATUS = TENANT_PROVISIONING_STEP_STATUS;

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
  () => ({ getTenantDeprovisioningStatusAction: vi.fn() }),
);

const getTenantDeprovisioningStatusActionMock = vi.mocked(
  getTenantDeprovisioningStatusAction,
);

const mockRunningSteps = (): TTenantDeprovisioningState => ({
  ...mockIdleDeprovisioningSteps(),
  [REMOVE_DOMAIN]: { status: STEP_STATUS.RUNNING },
  run: { startedAt: MOCK_RUN_STARTED_AT },
});

const mockFailedSteps = (): TTenantDeprovisioningState => ({
  ...mockIdleDeprovisioningSteps(),
  [REMOVE_DOMAIN]: { status: STEP_STATUS.FAILED, error: MOCK_STEP_ERROR },
  run: {
    startedAt: MOCK_RUN_STARTED_AT,
    finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
  },
});

const mockDoneSteps = (): TTenantDeprovisioningState => ({
  ...mockDoneDeprovisioningSteps(),
  run: {
    startedAt: MOCK_RUN_STARTED_AT,
    finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
  },
});

const mockStatusResult = (deprovisioningSteps: TTenantDeprovisioningState) => ({
  deprovisioningSteps,
  deprovisionedAt: null,
});

const mockFailedRevokeTenant = () =>
  mockClientTenant({
    deprovisioningSteps: {
      ...mockIdleDeprovisioningSteps(),
      [REVOKE_SANITY_TOKENS]: {
        status: STEP_STATUS.FAILED,
        error: MOCK_STEP_ERROR,
      },
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
      },
    },
  });

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const advanceThroughPollCap = async () => {
  for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
    await advance(STEP_POLL_INTERVAL_MS);
  }
};

describe(useDeprovisioningPoll, () => {
  beforeEach(() => {
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  describe('status derivation', () => {
    it('reports IDLE, in progress but not running, when every step is idle', () => {
      const tenant = mockClientTenant({
        deprovisioningSteps: {
          ...mockIdleDeprovisioningSteps(),
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(STEP_STATUS.IDLE);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isInProgress).toBe(true);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.isDone).toBe(false);
    });

    it('reports RUNNING when a step runs alongside a stale FAILED entry', () => {
      const tenant = mockClientTenant({
        deprovisioningSteps: {
          ...mockRunningSteps(),
          [ARCHIVE_SANITY_PROJECT]: {
            status: STEP_STATUS.FAILED,
            error: MOCK_STEP_ERROR,
          },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(STEP_STATUS.RUNNING);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('reports FAILED with the failing step and its classified error', () => {
      const tenant = mockFailedRevokeTenant();
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(STEP_STATUS.FAILED);
      expect(result.current.isInProgress).toBe(false);
      expect(result.current.isFailed).toBe(true);
      expect(result.current.failedStep).toBe(REVOKE_SANITY_TOKENS);
      expect(result.current.failedStepError).toBe(MOCK_STEP_ERROR);
      expect(result.current.errorKind).toBe('permission');
    });

    it('treats a request newer than a stale FAILED run as a fresh start', () => {
      const tenant = mockFailedRevokeTenant();
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, {
          isEnabled: true,
          deprovisionRequestedAt: MOCK_RUN_PLUS_2_MIN_AT,
        }),
      );

      expect(result.current.deprovisioningSteps).toBeNull();
      expect(result.current.overallStatus).toBe(STEP_STATUS.IDLE);
      expect(result.current.isInProgress).toBe(true);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.run).toBeUndefined();
    });

    it('keeps a stale FAILED run when the request is not newer than it', () => {
      const tenant = mockFailedRevokeTenant();
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, {
          isEnabled: true,
          deprovisionRequestedAt: MOCK_RUN_STARTED_AT,
        }),
      );

      expect(result.current.overallStatus).toBe(STEP_STATUS.FAILED);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isFailed).toBe(true);
      expect(result.current.failedStep).toBe(REVOKE_SANITY_TOKENS);
    });

    it('reports DONE only once every step is done', () => {
      const tenant = mockClientTenant({ deprovisioningSteps: mockDoneSteps() });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(STEP_STATUS.DONE);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isDone).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('exposes run and stepUpdatedAt read off deprovisioningSteps', () => {
      const tenant = mockClientTenant({
        deprovisioningSteps: {
          ...mockIdleDeprovisioningSteps(),
          [REMOVE_DOMAIN]: {
            status: STEP_STATUS.DONE,
            updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
          },
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.run).toEqual({ startedAt: MOCK_RUN_STARTED_AT });
      expect(result.current.stepUpdatedAt[0]).toBe(MOCK_RUN_PLUS_1_MIN_AT);
      expect(result.current.stepUpdatedAt[1]).toBeUndefined();
    });
  });

  describe('polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ['done', mockDoneSteps],
      ['failed', mockFailedSteps],
    ])(
      'applies a fresh result and stops polling once the run is %s',
      async (_label, mockTerminalSteps) => {
        getTenantDeprovisioningStatusActionMock.mockResolvedValue(
          mockStatusResult(mockTerminalSteps()),
        );
        const tenant = mockClientTenant({
          deprovisioningSteps: mockRunningSteps(),
        });
        const { result } = renderHook(() =>
          useDeprovisioningPoll(tenant, ENABLED),
        );

        expect(result.current.isRunning).toBe(true);

        await advance(STEP_POLL_INTERVAL_MS);

        expect(result.current.isRunning).toBe(false);
        expect(result.current.isInProgress).toBe(false);
        expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );

        await advance(STEP_POLL_INTERVAL_MS * 3);

        expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it('does not poll when the run is already terminal on mount', async () => {
      const tenant = mockClientTenant({
        deprovisioningSteps: mockFailedSteps(),
      });
      renderHook(() => useDeprovisioningPoll(tenant, ENABLED));

      await advance(STEP_POLL_INTERVAL_MS * 2);

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('resumes polling for a retry over a stale FAILED run and adopts the new run', async () => {
      const retryRun = { startedAt: MOCK_RUN_PLUS_4_MIN_AT };
      getTenantDeprovisioningStatusActionMock.mockResolvedValue(
        mockStatusResult({ ...mockRunningSteps(), run: retryRun }),
      );
      const tenant = mockClientTenant({
        deprovisioningSteps: mockFailedSteps(),
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, {
          isEnabled: true,
          deprovisionRequestedAt: MOCK_RUN_PLUS_2_MIN_AT,
        }),
      );

      expect(result.current.isInProgress).toBe(true);
      expect(result.current.deprovisioningSteps).toBeNull();

      await advance(STEP_POLL_INTERVAL_MS);

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(result.current.overallStatus).toBe(STEP_STATUS.RUNNING);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.run).toEqual(retryRun);
    });

    it.each([
      [
        'a run that never finishes',
        mockRunningSteps(),
        { isEnabled: true } as const,
      ],
      [
        'a retry over a failed prior run',
        mockFailedSteps(),
        { isEnabled: true, deprovisionRequestedAt: MOCK_RUN_PLUS_2_MIN_AT },
      ],
      [
        'a first request with no run marker yet',
        null,
        { isEnabled: true, deprovisionRequestedAt: MOCK_RUN_PLUS_2_MIN_AT },
      ],
    ])(
      'stops polling at the cap for %s when the workflow never reports in',
      async (_label, deprovisioningSteps, options) => {
        const tenant = mockClientTenant({ deprovisioningSteps });
        renderHook(() => useDeprovisioningPoll(tenant, options));

        await advanceThroughPollCap();

        expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
          MAX_POLL_TICKS,
        );
      },
    );

    it('reports nothing in progress and never polls while disabled', async () => {
      const tenant = mockClientTenant({ deprovisioningSteps: null });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, { isEnabled: false }),
      );

      await advance(STEP_POLL_INTERVAL_MS * 3);

      expect(result.current.isInProgress).toBe(false);
      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });

    describe('tab visibility', () => {
      let visibility: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        visibility = vi.spyOn(document, 'visibilityState', 'get');
        visibility.mockReturnValue('hidden');
        const tenant = mockClientTenant({ deprovisioningSteps: null });
        renderHook(() => useDeprovisioningPoll(tenant, ENABLED));
      });

      afterEach(() => {
        visibility.mockRestore();
      });

      it('pauses polling while the tab is hidden', async () => {
        await advance(STEP_POLL_INTERVAL_MS * 3);

        expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
      });

      it('resumes polling once the tab is visible again', async () => {
        visibility.mockReturnValue('visible');
        fireEvent(document, new Event('visibilitychange'));
        await advance(STEP_POLL_INTERVAL_MS);

        expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
          1,
        );
      });
    });

    it('stops polling once the hook unmounts', async () => {
      const tenant = mockClientTenant({
        deprovisioningSteps: mockRunningSteps(),
      });
      const { unmount } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      unmount();
      await advance(STEP_POLL_INTERVAL_MS * 2);

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });
  });
});
