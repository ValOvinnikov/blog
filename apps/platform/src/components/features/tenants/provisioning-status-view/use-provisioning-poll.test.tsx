import { LOCALE_ISO_CODES } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import {
  ToastProvider,
  TOAST_EXIT_ANIMATION_MS,
} from '@platform/context/toast-provider';
import messages from '@platform/i18n/messages/en.json';
import {
  idleProvisioningSteps,
  makeTenant,
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
const DOMAIN_POLL_INTERVAL_MS = 10000;
// Mirrors the hook's own `RETRY_BASELINE_MAX_TICKS`.
const RETRY_BASELINE_MAX_TICKS = 75;

// The hook reads `useTranslations`/`useToast` — every `renderHook` call
// below needs both contexts, so this shadows the RTL import once rather
// than passing `{ wrapper }` at each of its call sites.
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
  getDomainVerificationStatusActionMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
  getDomainVerificationStatusActionMock: vi.fn(),
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

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: getDomainVerificationStatusActionMock,
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
    getDomainVerificationStatusActionMock.mockReset();
    getDomainVerificationStatusActionMock.mockResolvedValue('NOT_CONFIGURED');
  });

  describe('STEP_ORDER', () => {
    it('is the five core provisioning steps, excluding OWNER_ELEVATION', () => {
      expect(STEP_ORDER).toHaveLength(5);
      expect(STEP_ORDER).not.toContain(
        TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      );
    });
  });

  describe('ownerElevationOutcome', () => {
    it('is undefined when the OWNER_ELEVATION step has not reported yet', () => {
      const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.ownerElevationOutcome).toBeUndefined();
    });

    it('is undefined when provisioningSteps itself is null', () => {
      const tenant = makeTenant({ provisioningSteps: null });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.ownerElevationOutcome).toBeUndefined();
    });

    it('reads the detail off the OWNER_ELEVATION step once reported', () => {
      const tenant = makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: 'STALLED',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.ownerElevationOutcome).toBe('STALLED');
    });

    it('never influences isProvisioningRunning/isOverallFailed/overallStepStatus/displayOverallStatus, regardless of its value', () => {
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
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      };

      const withoutOwnerElevation = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: allStepsDone,
      });
      const { result: withoutResult } = renderHook(() =>
        useProvisioningPoll(withoutOwnerElevation, 'NOT_CONFIGURED'),
      );

      const withStalledOwnerElevation = makeTenant({
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
        useProvisioningPoll(withStalledOwnerElevation, 'NOT_CONFIGURED'),
      );

      expect(withResult.current.ownerElevationOutcome).toBe('STALLED');
      expect(withResult.current.isOverallFailed).toBe(
        withoutResult.current.isOverallFailed,
      );
      expect(withResult.current.isOverallFailed).toBe(false);
      expect(withResult.current.isProvisioningRunning).toBe(
        withoutResult.current.isProvisioningRunning,
      );
      expect(withResult.current.overallStepStatus).toBe(
        withoutResult.current.overallStepStatus,
      );
      expect(withResult.current.displayOverallStatus).toBe(
        withoutResult.current.displayOverallStatus,
      );
    });
  });

  describe('status derivation', () => {
    it('exposes provisioningRun read off provisioningSteps.run, and undefined when absent', () => {
      const withoutRun = makeTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result: withoutResult } = renderHook(() =>
        useProvisioningPoll(withoutRun, 'NOT_CONFIGURED'),
      );
      expect(withoutResult.current.provisioningRun).toBeUndefined();

      const withRun = makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            registry: 'production',
          },
        },
      });
      const { result: withResult } = renderHook(() =>
        useProvisioningPoll(withRun, 'NOT_CONFIGURED'),
      );
      expect(withResult.current.provisioningRun).toEqual({
        startedAt: '2026-08-12T14:18:00.000Z',
        registry: 'production',
      });
    });

    it('exposes stepUpdatedAt parallel to STEP_ORDER, undefined for a step with none recorded', () => {
      const tenant = makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.stepUpdatedAt[0]).toBe('2026-08-12T14:19:00.000Z');
      expect(result.current.stepUpdatedAt[1]).toBeUndefined();
    });

    it('reports allIdle and IDLE overall status when every step is idle', () => {
      const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.allIdle).toBe(true);
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.overallStepStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
    });

    it('surfaces a FAILED step as the overall status even with other steps still idle, and classifies its error', () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.failedStepError).toBe('fetch failed');
      expect(result.current.errorKind).toBe('network');
    });

    it('does not treat a stale FAILED step as a current failure while provisioningStatus is still non-terminal', () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.overallStepStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.failedStepError).toBeUndefined();
      expect(result.current.errorKind).toBeUndefined();
    });

    it('masks a stale FAILED step to IDLE and reports RUNNING, not FAILED, once a retried run is genuinely PROVISIONING', () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel Domains API returned 500',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.isProvisioningRunning).toBe(true);
      expect(result.current.isOverallFailed).toBe(false);
      expect(result.current.displayOverallStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
      // The raw array still carries the real FAILED entry — only the
      // display-facing one is masked.
      expect(result.current.stepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
      expect(result.current.displayStepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      );
    });

    it('still reports a step as FAILED in displayStepStatuses once the tenant is genuinely, currently FAILED', () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel Domains API returned 500',
          },
        },
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.isOverallFailed).toBe(true);
      expect(result.current.displayStepStatuses[3]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
    });

    it('prioritises FAILED over RUNNING across steps for the overall status', () => {
      const tenant = makeTenant({
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
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      expect(result.current.overallStepStatus).toBe(
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      );
    });

    it('treats an in-flight dispatch on an all-idle tenant as RUNNING for display, without marking any individual step failed', async () => {
      const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
      retryProvisioningStepActionMock.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

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
      const tenant = makeTenant({
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
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

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
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      renderHook(() => useProvisioningPoll(tenant, 'NOT_CONFIGURED'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling once the tenant reaches a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: idleProvisioningSteps(),
      });
      renderHook(() => useProvisioningPoll(tenant, 'NOT_CONFIGURED'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('stops polling once an early step fails with nothing else running, even though provisioningStatus stays non-terminal', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      renderHook(() => useProvisioningPoll(tenant, 'NOT_CONFIGURED'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('keeps polling across a Retry even when the first post-retry tick still reflects the pre-retry snapshot', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      // Confirm it's genuinely stopped on mount.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();

      getTenantProvisioningStatusActionMock.mockResolvedValueOnce({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
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

      // First tick after Retry: still the stale, unchanged snapshot — must
      // not stop polling on it.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      // Second tick: the retried workflow has now actually started.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(2);
      expect(result.current.stepStatuses[0]).toBe(
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
    });

    it('stops polling once the retry-baseline wait is exhausted, even though the fetched steps never change', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      // Models a retry whose dispatched workflow never actually starts —
      // every tick reports the exact same failed-and-nothing-running
      // snapshot forever.
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      act(() => {
        result.current.handleRetry();
      });

      // Advance well past the cap, one tick's worth of real time at a time
      // (rather than in a single large jump) so each tick's resulting state
      // change — including the interval being torn down once the cap
      // fires — is actually committed before the next tick is simulated.
      for (let tick = 0; tick < RETRY_BASELINE_MAX_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      // Polling must have stopped once the cap was reached — it never grew
      // past that regardless of how much further time was simulated.
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        RETRY_BASELINE_MAX_TICKS,
      );
    });

    it('stops polling once the retry-baseline wait is exhausted after Start, when every step stays idle', async () => {
      // Models pressing Start (not Retry) whose dispatched workflow never
      // actually starts — every tick reports the same all-idle snapshot
      // forever, so `shouldContinuePolling` alone would never stop it.
      const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      act(() => {
        result.current.handleStart();
      });

      for (let tick = 0; tick < RETRY_BASELINE_MAX_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      // Polling must have stopped once the cap was reached — it never grew
      // past that regardless of how much further time was simulated.
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        RETRY_BASELINE_MAX_TICKS,
      );
    });

    it('stops polling once the hook unmounts', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { unmount } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('surfaces a poll-error toast and keeps retrying automatically when a tick rejects, dismissing it once a tick recovers', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
        new Error('NEXT_REDIRECT'),
      );
      renderHook(() => useProvisioningPoll(tenant, 'NOT_CONFIGURED'));

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
          STEP_POLL_INTERVAL_MS + TOAST_EXIT_ANIMATION_MS,
        );
      });
      expect(
        screen.queryByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('domain verification polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls for domain status on its own interval and applies a fresh result', async () => {
      const tenant = makeTenant();
      getDomainVerificationStatusActionMock.mockResolvedValue('VERIFIED');
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'PENDING'),
      );

      expect(result.current.domainStatus).toBe('PENDING');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });

      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledWith(
        tenant.id,
      );
      expect(result.current.domainStatus).toBe('VERIFIED');
    });

    it('does not poll the domain when it is already NOT_CONFIGURED', async () => {
      const tenant = makeTenant();
      renderHook(() => useProvisioningPoll(tenant, 'NOT_CONFIGURED'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS * 2);
      });

      expect(getDomainVerificationStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling the domain once it reaches VERIFIED', async () => {
      const tenant = makeTenant();
      getDomainVerificationStatusActionMock.mockResolvedValue('VERIFIED');
      renderHook(() => useProvisioningPoll(tenant, 'PENDING'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });
      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS * 2);
      });
      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry/start dispatch', () => {
    it('dispatches a retry and reports no error on success', async () => {
      const tenant = makeTenant({ id: 'tenant-1' });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

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
      const tenant = makeTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'not-found',
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('not-found');
      });
    });

    it('reports an archived dispatch error distinctly from a generic one', async () => {
      const tenant = makeTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'archived',
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('archived');
      });
    });

    it('reports a generic dispatch error for a dispatch failure', async () => {
      const tenant = makeTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'dispatch-error',
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.dispatchNotice).toBe('other');
      });
    });

    it('reports already-in-progress distinctly from a real failure, and still refreshes', async () => {
      const tenant = makeTenant();
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: 'already-in-progress',
      });
      const { result } = renderHook(() =>
        useProvisioningPoll(tenant, 'NOT_CONFIGURED'),
      );

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
