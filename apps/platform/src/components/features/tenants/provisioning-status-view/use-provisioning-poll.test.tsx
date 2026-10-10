import { LOCALE_ISO_CODES } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { ToastProvider } from '@platform/context/toast-provider';
import messages from '@platform/i18n/messages/en.json';
import {
  idleProvisioningSteps,
  makeClientTenant,
} from '@platform/testing/tenants/fixtures';
import {
  act,
  renderHook as rtlRenderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { STEP_ORDER, useProvisioningPoll } from './use-provisioning-poll';

const STEP_POLL_INTERVAL_MS = 4000;
const TOAST_EXIT_BUFFER_MS = 1000;
const MAX_POLL_TICKS = 375;

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
    <ToastProvider>{children}</ToastProvider>
  </NextIntlClientProvider>
);

const renderHook: typeof rtlRenderHook = (callback, options) =>
  rtlRenderHook(callback, { wrapper: Wrapper, ...options });

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

describe(useProvisioningPoll, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatched',
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
  });

  describe('STEP_ORDER', () => {
    it('is the six core provisioning steps, excluding OWNER_ELEVATION', () => {
      expect(STEP_ORDER).toHaveLength(6);
      expect(STEP_ORDER).not.toContain(
        TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      );
    });
  });

  describe('ownerElevationOutcome', () => {
    it('is undefined when the OWNER_ELEVATION step has not reported yet', () => {
      const tenant = makeClientTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.ownerElevationOutcome).toBeUndefined();
    });

    it('is undefined when provisioningSteps itself is null', () => {
      const tenant = makeClientTenant({ provisioningSteps: null });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.ownerElevationOutcome).toBeUndefined();
    });

    it('reads the detail off the OWNER_ELEVATION step once reported', () => {
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: 'STALLED',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.ownerElevationOutcome).toBe('STALLED');
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

      const withoutOwnerElevation = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: allStepsDone,
      });
      const { result: withoutResult } = renderHook(() =>
        useProvisioningPoll(withoutOwnerElevation),
      );

      const withStalledOwnerElevation = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: {
          ...allStepsDone,
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: 'STALLED',
          },
        },
      });
      const { result: withResult } = renderHook(() =>
        useProvisioningPoll(withStalledOwnerElevation),
      );

      expect(withResult.current.ownerElevationOutcome).toBe('STALLED');
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
      const withoutRun = makeClientTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result: withoutResult } = renderHook(() =>
        useProvisioningPoll(withoutRun),
      );
      expect(withoutResult.current.provisioningRun).toBeUndefined();

      const withRun = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            registry: 'production',
          },
        },
      });
      const { result: withResult } = renderHook(() =>
        useProvisioningPoll(withRun),
      );
      expect(withResult.current.provisioningRun).toEqual({
        startedAt: '2026-08-12T14:18:00.000Z',
        registry: 'production',
      });
    });

    it('exposes stepUpdatedAt parallel to STEP_ORDER, undefined for a step with none recorded', () => {
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.stepUpdatedAt[0]).toBe('2026-08-12T14:19:00.000Z');
      expect(result.current.stepUpdatedAt[1]).toBeUndefined();
    });

    it('reports allIdle and IDLE overall status when every step is idle', () => {
      const tenant = makeClientTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.allIdle).toBe(true);
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.displayOverallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
    });

    it('surfaces a FAILED step as the overall status even with other steps still idle, and classifies its error', () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.failedStepError).toBe('fetch failed');
      expect(result.current.errorKind).toBe('network');
    });

    it('does not treat a stale FAILED step as a current failure while provisioningStatus is still non-terminal', () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.failedStepError).toBeUndefined();
      expect(result.current.errorKind).toBeUndefined();
    });

    it('masks a stale FAILED step to IDLE and reports RUNNING, not FAILED, once a retried run is genuinely PROVISIONING', () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel Domains API returned 500',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

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
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel Domains API returned 500',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.displayStepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
    });

    it('reports a failure even while another step still reads RUNNING', () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.failedStepError).toBe('boom');
    });

    it('treats an in-flight dispatch on an all-idle tenant as RUNNING for display, without marking any individual step failed', async () => {
      const tenant = makeClientTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      retryProvisioningStepActionMock.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleStart();
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
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      );
    });

    it('does not poll at all when already at a terminal status', async () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      renderHook(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling once the tenant reaches a terminal status', async () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: idleProvisioningSteps(),
      });
      renderHook(() => useProvisioningPoll(tenant));

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
      ['PENDING', TENANT_PROVISIONING_STATUS.PENDING],
      ['null', null],
    ])(
      'does not poll a tenant whose provisioning status is %s',
      async (_label, provisioningStatus) => {
        const tenant = makeClientTenant({
          provisioningStatus,
          provisioningSteps: idleProvisioningSteps(),
        });
        renderHook(() => useProvisioningPoll(tenant));

        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
        });

        expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
      },
    );

    it('keeps polling through a Retry while the runner has not reported a step yet', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: failedSteps,
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

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
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });

      act(() => {
        result.current.handleRetry();
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
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      };
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: stuckSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: stuckSteps,
      });
      renderHook(() => useProvisioningPoll(tenant));

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
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: idleProvisioningSteps(),
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      await act(async () => {
        result.current.handleStart();
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
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const visibility = vi.spyOn(document, 'visibilityState', 'get');
      visibility.mockReturnValue('hidden');
      renderHook(() => useProvisioningPoll(tenant));

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
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { unmount } = renderHook(() => useProvisioningPoll(tenant));

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('surfaces a poll-error toast and keeps retrying automatically when a tick rejects, dismissing it once a tick recovers', async () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
        new Error('NEXT_REDIRECT'),
      );
      renderHook(() => useProvisioningPoll(tenant));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(
        screen.getByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).toBeVisible();

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          STEP_POLL_INTERVAL_MS + TOAST_EXIT_BUFFER_MS,
        );
      });
      expect(
        screen.queryByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('retry/start dispatch', () => {
    it('dispatches a retry and reports no error on success', async () => {
      const tenant = makeClientTenant({ id: 'tenant-1' });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
          'tenant-1',
        );
      });
      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });
      expect(result.current.dispatchNotice).toBeUndefined();
    });

    it('reports a not-found dispatch error distinctly from a generic one', async () => {
      const tenant = makeClientTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'not-found',
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('not-found');
      });
    });

    it('reports an archived dispatch error distinctly from a generic one', async () => {
      const tenant = makeClientTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'archived',
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('archived');
      });
    });

    it('reports a generic dispatch error for a dispatch failure', async () => {
      const tenant = makeClientTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'dispatch-error',
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('other');
      });
    });

    it('reports already-in-progress distinctly from a real failure, and still refreshes', async () => {
      const tenant = makeClientTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'already-in-progress',
      });
      const { result } = renderHook(() => useProvisioningPoll(tenant));

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('already-in-progress');
      });
      expect(result.current.isStarting).toBe(false);
    });
  });
});
