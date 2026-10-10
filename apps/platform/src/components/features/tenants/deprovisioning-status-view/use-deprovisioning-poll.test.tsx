import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  doneDeprovisioningSteps,
  idleDeprovisioningSteps,
  makeClientTenant,
} from '@platform/testing/tenants/fixtures';
import { act, renderHook } from '@testing-library/react';

import { STEP_ORDER, useDeprovisioningPoll } from './use-deprovisioning-poll';

const STEP_POLL_INTERVAL_MS = 4000;
const MAX_POLL_TICKS = 75;
const ENABLED = { isEnabled: true };

const { getTenantDeprovisioningStatusActionMock } = vi.hoisted(() => ({
  getTenantDeprovisioningStatusActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
  () => ({
    getTenantDeprovisioningStatusAction:
      getTenantDeprovisioningStatusActionMock,
  }),
);

const makeFailedRevokeTenant = () =>
  makeClientTenant({
    deprovisioningSteps: {
      ...idleDeprovisioningSteps(),
      [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: 'Sanity Access API returned 403',
      },
      run: {
        startedAt: '2026-08-12T14:18:00.000Z',
        finishedAt: '2026-08-12T14:19:00.000Z',
      },
    },
  });

describe(useDeprovisioningPoll, () => {
  beforeEach(() => {
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  describe('STEP_ORDER', () => {
    it('is the seven core deprovisioning steps, in run order', () => {
      expect(STEP_ORDER).toEqual([
        DEPROVISIONING_STEP.REMOVE_DOMAIN,
        DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
        DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
        DEPROVISIONING_STEP.CLEAR_ARTIFACTS,
        DEPROVISIONING_STEP.ARCHIVE_TENANT,
        DEPROVISIONING_STEP.PURGE_READER_DATA,
        DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
      ]);
    });
  });

  describe('status derivation', () => {
    it('reports IDLE, in progress but not running, when every step is idle', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isInProgress).toBe(true);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.isDone).toBe(false);
    });

    it('reports RUNNING when any step is running, even alongside a stale FAILED entry from a prior attempt', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'stale failure from a previous run',
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('reports FAILED with the failing step and its error when a step fails and nothing else is running', () => {
      const { result } = renderHook(() =>
        useDeprovisioningPoll(makeFailedRevokeTenant(), ENABLED),
      );

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.isInProgress).toBe(false);
      expect(result.current.isFailed).toBe(true);
      expect(result.current.failedStep).toBe(
        DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
      );
      expect(result.current.failedStepError).toBe(
        'Sanity Access API returned 403',
      );
      expect(result.current.errorKind).toBe('permission');
    });

    it('treats a deprovision request newer than a stale FAILED run as a fresh start, not the old failure', () => {
      const { result } = renderHook(() =>
        useDeprovisioningPoll(makeFailedRevokeTenant(), {
          isEnabled: true,
          deprovisionRequestedAt: '2026-08-12T14:25:00.000Z',
        }),
      );

      expect(result.current.deprovisioningSteps).toBeNull();
      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
      expect(result.current.isInProgress).toBe(true);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.run).toBeUndefined();
    });

    it('keeps showing a stale FAILED run when the deprovision request is not newer than it', () => {
      const { result } = renderHook(() =>
        useDeprovisioningPoll(makeFailedRevokeTenant(), {
          isEnabled: true,
          deprovisionRequestedAt: '2026-08-12T14:15:00.000Z',
        }),
      );

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isFailed).toBe(true);
      expect(result.current.failedStep).toBe(
        DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
      );
    });

    it('reports DONE only once every step is done', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...doneDeprovisioningSteps(),
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:20:00.000Z',
          },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      );
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isDone).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('exposes run and stepUpdatedAt read off deprovisioningSteps', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.run).toEqual({
        startedAt: '2026-08-12T14:18:00.000Z',
      });
      expect(result.current.stepUpdatedAt[0]).toBe('2026-08-12T14:19:00.000Z');
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

    it('polls while the run is in progress and applies a fresh result', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
        deprovisionedAt: null,
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      );
    });

    it('transitions from running to done across polls and stops polling once done', async () => {
      const runningSteps = {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      };
      const doneSteps = {
        ...doneDeprovisioningSteps(),
        run: {
          startedAt: '2026-08-12T14:18:00.000Z',
          finishedAt: '2026-08-12T14:20:00.000Z',
        },
      };
      const tenant = makeClientTenant({ deprovisioningSteps: runningSteps });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: doneSteps,
        deprovisionedAt: new Date('2026-08-12T14:20:00.000Z'),
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      expect(result.current.isRunning).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(result.current.isDone).toBe(true);
      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });
      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('does not poll at all when the run is already terminal on mount', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      renderHook(() => useDeprovisioningPoll(tenant, ENABLED));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('resumes polling for a retry dispatched over a stale FAILED run, and adopts the new run once it reports in', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:26:00.000Z' },
        },
        deprovisionedAt: null,
      });
      const { result } = renderHook(() =>
        useDeprovisioningPoll(tenant, {
          isEnabled: true,
          deprovisionRequestedAt: '2026-08-12T14:25:00.000Z',
        }),
      );

      expect(result.current.isInProgress).toBe(true);
      expect(result.current.deprovisioningSteps).toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(result.current.isFailed).toBe(false);
      expect(result.current.run).toEqual({
        startedAt: '2026-08-12T14:26:00.000Z',
      });
    });

    it('stops polling once the tenant reaches a failed terminal state', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:19:00.000Z',
          },
        },
        deprovisionedAt: null,
      });
      renderHook(() => useDeprovisioningPoll(tenant, ENABLED));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('stops polling once a stale, never-finishing run exceeds the polling cap', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
        deprovisionedAt: null,
      });
      renderHook(() => useDeprovisioningPoll(tenant, ENABLED));

      for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    it('bounds a pending retry starting state by the same stale-run cap when the workflow never reports in', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
      renderHook(() =>
        useDeprovisioningPoll(tenant, {
          isEnabled: true,
          deprovisionRequestedAt: '2026-08-12T14:25:00.000Z',
        }),
      );

      for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    it('reports nothing in progress and never polls while disabled', async () => {
      const { result } = renderHook(() =>
        useDeprovisioningPoll(makeClientTenant({ deprovisioningSteps: null }), {
          isEnabled: false,
        }),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      expect(result.current.isInProgress).toBe(false);
      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('pauses polling while the tab is hidden and resumes once it is visible again', async () => {
      const tenant = makeClientTenant({ deprovisioningSteps: null });
      const visibility = vi.spyOn(document, 'visibilityState', 'get');
      visibility.mockReturnValue('hidden');
      renderHook(() => useDeprovisioningPoll(tenant, ENABLED));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });
      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();

      visibility.mockReturnValue('visible');
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(1);

      visibility.mockRestore();
    });

    it('stops polling once the hook unmounts', async () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { unmount } = renderHook(() =>
        useDeprovisioningPoll(tenant, ENABLED),
      );

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });
  });
});
