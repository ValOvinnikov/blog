import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';
import { act, renderHook } from '@testing-library/react';

import { STEP_ORDER, useDeprovisioningPoll } from './use-deprovisioning-poll';

const STEP_POLL_INTERVAL_MS = 4000;
const STALE_RUN_MAX_TICKS = 75;

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

describe(useDeprovisioningPoll, () => {
  beforeEach(() => {
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  describe('STEP_ORDER', () => {
    it('is the six core deprovisioning steps, in run order', () => {
      expect(STEP_ORDER).toEqual([
        DEPROVISIONING_STEP.REMOVE_DOMAIN,
        DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
        DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
        DEPROVISIONING_STEP.CLEAR_ARTIFACTS,
        DEPROVISIONING_STEP.ARCHIVE_TENANT,
        DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
      ]);
    });
  });

  describe('status derivation', () => {
    it('reports IDLE and isRunning when every step is idle', () => {
      const tenant = makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.isDone).toBe(false);
    });

    it('reports RUNNING when any step is running, even alongside a stale FAILED entry from a prior attempt', () => {
      const tenant = makeTenant({
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
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('reports FAILED with the failing step and its error when a step fails and nothing else is running', () => {
      const tenant = makeTenant({
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
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isFailed).toBe(true);
      expect(result.current.failedStep).toBe(
        DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
      );
      expect(result.current.failedStepError).toBe(
        'Sanity Access API returned 403',
      );
      expect(result.current.errorKind).toBe('permission');
    });

    it('reports DONE only once every step is done', () => {
      const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
      const tenant = makeTenant({
        deprovisioningSteps: {
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: done,
          [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: done,
          [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: done,
          [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: done,
          [DEPROVISIONING_STEP.ARCHIVE_TENANT]: done,
          [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: done,
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:20:00.000Z',
          },
        },
      });
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

      expect(result.current.overallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      );
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isDone).toBe(true);
      expect(result.current.isFailed).toBe(false);
    });

    it('exposes run and stepUpdatedAt read off deprovisioningSteps', () => {
      const tenant = makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

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
      const tenant = makeTenant({
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
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

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
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [DEPROVISIONING_STEP.ARCHIVE_TENANT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        run: {
          startedAt: '2026-08-12T14:18:00.000Z',
          finishedAt: '2026-08-12T14:20:00.000Z',
        },
      };
      const tenant = makeTenant({ deprovisioningSteps: runningSteps });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: doneSteps,
        deprovisionedAt: new Date('2026-08-12T14:20:00.000Z'),
      });
      const { result } = renderHook(() => useDeprovisioningPoll(tenant));

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
      const tenant = makeTenant({
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
      renderHook(() => useDeprovisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling once the tenant reaches a failed terminal state', async () => {
      const tenant = makeTenant({
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
      renderHook(() => useDeprovisioningPoll(tenant));

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
      const tenant = makeTenant({
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
      renderHook(() => useDeprovisioningPoll(tenant));

      for (let tick = 0; tick < STALE_RUN_MAX_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
        STALE_RUN_MAX_TICKS,
      );
    });

    it('stops polling once the hook unmounts', async () => {
      const tenant = makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { unmount } = renderHook(() => useDeprovisioningPoll(tenant));

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
    });
  });
});
