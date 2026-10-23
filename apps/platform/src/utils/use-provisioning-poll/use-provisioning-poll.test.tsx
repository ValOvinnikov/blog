import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import {
  act,
  renderHookWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import {
  mockIdleProvisioningSteps,
  mockClientTenant,
  MOCK_TENANT_ID,
  MOCK_RUN_STARTED_AT,
  MOCK_RUN_PLUS_1_MIN_AT,
} from '@platform/testing/tenants/fixtures';
import { TOAST_EXIT_BUFFER_MS } from '@platform/testing/toast-timing';

import { useProvisioningPoll } from './use-provisioning-poll';

const STEP_POLL_INTERVAL_MS = 1500;
const MAX_POLL_TICKS = 400;

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const FETCH_FAILED = 'fetch failed';
const DOMAINS_API_ERROR = 'Vercel Domains API returned 500';
const COULDNT_REFRESH_LATEST_STATUS =
  "Couldn't refresh the latest status — retrying automatically.";

describe(useProvisioningPoll, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset();
  });

  describe('ownerElevationOutcome', () => {
    it.each([
      ['has not reported yet', mockIdleProvisioningSteps()],
      ['is null', null],
    ])('is undefined while the step %s', (_, provisioningSteps) => {
      const tenant = mockClientTenant({ provisioningSteps });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.ownerElevationOutcome).toBeUndefined();
    });

    it('reads the detail off the OWNER_ELEVATION step once reported', () => {
      const tenant = mockClientTenant({
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.ownerElevationOutcome).toBe(
        ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      );
    });

    it('never influences isProvisioningRunning/isOverallFailed/displayOverallStatus, regardless of its value', () => {
      const allStepsDone = {
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      };

      const withoutOwnerElevation = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: allStepsDone,
      });
      const { result: withoutResult } = renderHookWithIntl(() =>
        useProvisioningPoll(withoutOwnerElevation),
      );

      const withStalledOwnerElevation = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: {
          ...allStepsDone,
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
          },
        },
      });
      const { result: withResult } = renderHookWithIntl(() =>
        useProvisioningPoll(withStalledOwnerElevation),
      );

      expect(withResult.current.ownerElevationOutcome).toBe(
        ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      );
      expect(withResult.current.isOverallFailed).toBe(
        withoutResult.current.isOverallFailed,
      );
      expect(withResult.current.isOverallFailed).toBe(false);
      expect(withResult.current.isProvisioningRunning).toBe(
        withoutResult.current.isProvisioningRunning,
      );
      expect(withResult.current.displayOverallStatus).toBe(
        withoutResult.current.displayOverallStatus,
      );
    });
  });

  describe('status derivation', () => {
    it('exposes provisioningRun read off provisioningSteps.run, and undefined when absent', () => {
      const withoutRun = mockClientTenant({
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      const { result: withoutResult } = renderHookWithIntl(() =>
        useProvisioningPoll(withoutRun),
      );
      expect(withoutResult.current.provisioningRun).toBeUndefined();

      const withRun = mockClientTenant({
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          run: {
            startedAt: MOCK_RUN_STARTED_AT,
            registry: 'production',
          },
        },
      });
      const { result: withResult } = renderHookWithIntl(() =>
        useProvisioningPoll(withRun),
      );
      expect(withResult.current.provisioningRun).toEqual({
        startedAt: MOCK_RUN_STARTED_AT,
        registry: 'production',
      });
    });

    it('exposes stepUpdatedAt in core step order, undefined for a step with none recorded', () => {
      const tenant = mockClientTenant({
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.stepUpdatedAt[0]).toBe(MOCK_RUN_PLUS_1_MIN_AT);
      expect(result.current.stepUpdatedAt[1]).toBeUndefined();
    });

    it('reports allIdle and IDLE overall status when every step is idle', () => {
      const tenant = mockClientTenant({
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.allIdle).toBe(true);
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.displayOverallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
    });

    it('surfaces a FAILED step as the overall status even with other steps still idle, and classifies its error', () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: FETCH_FAILED,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.failedStepError).toBe(FETCH_FAILED);
      expect(result.current.errorKind).toBe('network');
    });

    it('does not treat a stale FAILED step as a current failure while provisioningStatus is still non-terminal', () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: FETCH_FAILED,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.failedStepError).toBeUndefined();
      expect(result.current.errorKind).toBeUndefined();
    });

    it('masks a stale FAILED step to IDLE and reports RUNNING, not FAILED, once a retried run is genuinely PROVISIONING', () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: DOMAINS_API_ERROR,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.isProvisioningRunning).toBe(true);
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.displayOverallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(result.current.stepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.displayStepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
    });

    it('still reports a step as FAILED in displayStepStatuses once the tenant is genuinely, currently FAILED', () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: DOMAINS_API_ERROR,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.displayStepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
    });

    it('reports a failure even while another step still reads RUNNING', () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.failedStepError).toBe('boom');
    });

    it('treats an in-flight dispatch on an all-idle tenant as RUNNING for display, without marking any individual step failed', async () => {
      const tenant = mockClientTenant({
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      retryProvisioningStepActionMock.mockReturnValue(new Promise(() => {}));
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleDispatch();
      });

      await waitFor(() => {
        expect(result.current.isProvisioningRunning).toBe(true);
      });
      expect(result.current.displayOverallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(result.current.isOverallFailed).toBe(false);
    });
  });

  describe('step-status polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls while provisioning is non-terminal and applies a fresh result', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      );
    });

    it('does not poll at all when already at a terminal status', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling once the tenant reaches a terminal status', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      [TENANT_PROVISIONING_STATUS.PENDING, TENANT_PROVISIONING_STATUS.PENDING],
      ['null', null],
    ])(
      'does not poll a tenant whose provisioning status is %s',
      async (_label, provisioningStatus) => {
        const tenant = mockClientTenant({
          provisioningStatus,
          provisioningSteps: mockIdleProvisioningSteps(),
        });
        renderHookWithIntl(() => useProvisioningPoll(tenant));

        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
        });

        expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
      },
    );

    it('keeps polling, unchanged, while a step is RUNNING', async () => {
      const runningSteps = {
        ...mockIdleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      };
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: runningSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: runningSteps,
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(3);
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
    });

    it('keeps polling through a Retry while the runner has not reported a step yet', async () => {
      const failedSteps = {
        ...mockIdleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: FETCH_FAILED,
        },
      };
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: failedSteps,
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();

      getTenantProvisioningStatusActionMock.mockResolvedValueOnce({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: failedSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });

      act(() => {
        result.current.handleDispatch();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(2);
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
    });

    it('stops polling at the cap when a run stops reporting', async () => {
      const stuckSteps = {
        ...mockIdleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      };
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: stuckSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: stuckSteps,
      });
      renderHookWithIntl(() => useProvisioningPoll(tenant));

      for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    it('polls after Start until the cap when no runner ever picks the run up', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        result.current.handleDispatch();
      });

      for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    it('sends no status request while the tab is hidden, and resumes once it is visible again', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      const visibility = vi.spyOn(document, 'visibilityState', 'get');
      visibility.mockReturnValue('hidden');
      renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();

      visibility.mockReturnValue('visible');
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      visibility.mockRestore();
    });

    it('stops polling once the hook unmounts', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      const { unmount } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('surfaces a poll-error toast, keeps the last-known status, and keeps retrying automatically when a tick rejects, dismissing it once a tick recovers', async () => {
      const tenant = mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
        new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
      );
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      const couldNotRefreshText = screen.getByText(
        COULDNT_REFRESH_LATEST_STATUS,
      );

      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(couldNotRefreshText).toBeVisible();

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          STEP_POLL_INTERVAL_MS + TOAST_EXIT_BUFFER_MS,
        );
      });
      const couldNotRefreshText2 = screen.queryByText(
        COULDNT_REFRESH_LATEST_STATUS,
      );

      expect(couldNotRefreshText2).not.toBeInTheDocument();
    });
  });

  describe('dispatch', () => {
    it('dispatches the workflow and reports no error on success', async () => {
      const tenant = mockClientTenant({ id: MOCK_TENANT_ID });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleDispatch();
      });

      await waitFor(() => {
        expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
      });
      await waitFor(() => {
        expect(result.current.isDispatchPending).toBe(false);
      });
      expect(result.current.dispatchNotice).toBeUndefined();
    });

    it.each([
      [
        { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
        TENANT_REFUSAL.NOT_FOUND,
      ],
      [
        { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED },
        TENANT_REFUSAL.ARCHIVED,
      ],
      [{ outcome: ACTION_OUTCOME.SERVER_ERROR }, ACTION_OUTCOME.SERVER_ERROR],
    ])(
      'reports a failed dispatch as the %o notice',
      async (dispatchResult, notice) => {
        const tenant = mockClientTenant();
        retryProvisioningStepActionMock.mockResolvedValue(dispatchResult);
        const { result } = renderHookWithIntl(() =>
          useProvisioningPoll(tenant),
        );

        act(() => {
          result.current.handleDispatch();
        });

        await waitFor(() => {
          expect(result.current.dispatchNotice).toBe(notice);
        });
      },
    );

    it('reports already-in-progress distinctly from a real failure, and still refreshes', async () => {
      const tenant = mockClientTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      });
      const { result } = renderHookWithIntl(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleDispatch();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe(
          TENANT_REFUSAL.ALREADY_IN_PROGRESS,
        );
      });
      expect(result.current.isDispatchPending).toBe(false);
    });
  });
});
