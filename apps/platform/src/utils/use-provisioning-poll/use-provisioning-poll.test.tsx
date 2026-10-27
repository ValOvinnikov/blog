import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  act,
  renderHookWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import {
  mockIdleProvisioningSteps,
  mockClientTenant,
  mockDoneProvisioningSteps,
  mockFirstStepDoneProvisioningSteps,
  mockFirstStepRunningProvisioningSteps,
  mockMapDomainFailedProvisioningSteps,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { MOCK_TOAST_EXIT_BUFFER_MS } from '@platform/testing/toast/fixtures';

import { useProvisioningPoll } from './use-provisioning-poll';

const STEP_POLL_INTERVAL_MS = 1500;
const MAX_POLL_TICKS = 400;
const MOCK_NETWORK_ERROR = 'fetch failed';
const MOCK_DOMAINS_API_ERROR = 'Vercel Domains API returned 500';
const POLL_ERROR_WARNING = messages.provisioningStatusView.pollErrorWarning;

const { PROVISIONING, FAILED, PENDING, READY } = TENANT_PROVISIONING_STATUS;
const { SANITY_PROJECT } = TENANT_PROVISIONING_STEP;
const STEP_STATUS = TENANT_PROVISIONING_STEP_STATUS;

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const renderPoll = (tenant: TClientTenant) =>
  renderHookWithIntl(() => useProvisioningPoll(tenant));

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const advanceThroughPollCap = async () => {
  for (let tick = 0; tick < MAX_POLL_TICKS + 5; tick += 1) {
    await advance(STEP_POLL_INTERVAL_MS);
  }
};

const mockProvisioningStatusResult = (
  provisioningSteps = mockIdleProvisioningSteps(),
) => ({ provisioningStatus: PROVISIONING, provisioningSteps });

describe(useProvisioningPoll, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset();
  });

  it('derives its view state from the tenant steps and status', () => {
    const { result } = renderPoll(
      mockClientTenant({
        provisioningStatus: PROVISIONING,
        provisioningSteps: mockMapDomainFailedProvisioningSteps(
          MOCK_DOMAINS_API_ERROR,
        ),
      }),
    );

    expect(result.current.isProvisioningRunning).toBe(true);
    expect(result.current.displayStepStatuses[3]).toBe(STEP_STATUS.IDLE);
  });

  describe('step-status polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls while provisioning is non-terminal and applies a fresh result', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue(
        mockProvisioningStatusResult(mockFirstStepDoneProvisioningSteps()),
      );
      const { result } = renderPoll(
        mockClientTenant({
          provisioningStatus: PROVISIONING,
          provisioningSteps: mockFirstStepRunningProvisioningSteps(),
        }),
      );

      expect(result.current.stepStatuses[0]).toBe(STEP_STATUS.RUNNING);

      await advance(STEP_POLL_INTERVAL_MS);

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(result.current.stepStatuses[0]).toBe(STEP_STATUS.DONE);
    });

    it.each([
      [READY, mockDoneProvisioningSteps()],
      [PENDING, mockIdleProvisioningSteps()],
      [null, mockIdleProvisioningSteps()],
    ])(
      'does not poll a tenant whose provisioning status is %s',
      async (provisioningStatus, provisioningSteps) => {
        renderPoll(mockClientTenant({ provisioningStatus, provisioningSteps }));

        await advance(STEP_POLL_INTERVAL_MS * 2);

        expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
      },
    );

    it('stops polling once the tenant reaches a terminal status', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: FAILED,
        provisioningSteps: mockIdleProvisioningSteps(),
      });
      renderPoll(mockClientTenant({ provisioningStatus: PROVISIONING }));

      await advance(STEP_POLL_INTERVAL_MS);
      await advance(STEP_POLL_INTERVAL_MS * 2);

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('keeps polling through a Retry before the runner reports a step', async () => {
      const failedSteps = {
        ...mockIdleProvisioningSteps(),
        [SANITY_PROJECT]: {
          status: STEP_STATUS.FAILED,
          error: MOCK_NETWORK_ERROR,
        },
      };
      getTenantProvisioningStatusActionMock.mockResolvedValueOnce(
        mockProvisioningStatusResult(failedSteps),
      );
      getTenantProvisioningStatusActionMock.mockResolvedValue(
        mockProvisioningStatusResult(mockFirstStepRunningProvisioningSteps()),
      );
      const { result } = renderPoll(
        mockClientTenant({
          provisioningStatus: FAILED,
          provisioningSteps: failedSteps,
        }),
      );

      act(() => {
        result.current.handleDispatch();
      });
      await advance(STEP_POLL_INTERVAL_MS * 2);

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(2);
      expect(result.current.stepStatuses[0]).toBe(STEP_STATUS.RUNNING);
    });

    it('stops polling at the cap when a run stops reporting', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue(
        mockProvisioningStatusResult(mockFirstStepRunningProvisioningSteps()),
      );
      renderPoll(
        mockClientTenant({
          provisioningStatus: PROVISIONING,
          provisioningSteps: mockFirstStepRunningProvisioningSteps(),
        }),
      );

      await advanceThroughPollCap();

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    it('polls after Start until the cap when no runner picks the run up', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue(
        mockProvisioningStatusResult(),
      );
      const { result } = renderPoll(mockClientTenant());

      await act(async () => {
        result.current.handleDispatch();
      });
      await advanceThroughPollCap();

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        MAX_POLL_TICKS,
      );
    });

    describe('tab visibility', () => {
      let visibility: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        getTenantProvisioningStatusActionMock.mockResolvedValue(
          mockProvisioningStatusResult(),
        );
        visibility = vi.spyOn(document, 'visibilityState', 'get');
        visibility.mockReturnValue('hidden');
        renderPoll(mockClientTenant({ provisioningStatus: PROVISIONING }));
      });

      afterEach(() => {
        visibility.mockRestore();
      });

      it('sends no status request while the tab is hidden', async () => {
        await advance(STEP_POLL_INTERVAL_MS * 3);

        expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
      });

      it('resumes polling once the tab is visible again', async () => {
        visibility.mockReturnValue('visible');
        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await advance(STEP_POLL_INTERVAL_MS);

        expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
      });
    });

    it('stops polling once the hook unmounts', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue(
        mockProvisioningStatusResult(),
      );
      const { unmount } = renderPoll(
        mockClientTenant({ provisioningStatus: PROVISIONING }),
      );

      unmount();
      await advance(STEP_POLL_INTERVAL_MS * 2);

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    describe('when a tick rejects', () => {
      let result: ReturnType<typeof renderPoll>['result'];

      beforeEach(async () => {
        getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
          new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
        );
        ({ result } = renderPoll(
          mockClientTenant({
            provisioningStatus: PROVISIONING,
            provisioningSteps: mockFirstStepRunningProvisioningSteps(),
          }),
        ));

        await advance(STEP_POLL_INTERVAL_MS);
      });

      it('warns with a toast and keeps the last-known status', () => {
        const warning = screen.getByText(POLL_ERROR_WARNING);

        expect(warning).toBeVisible();
        expect(result.current.stepStatuses[0]).toBe(STEP_STATUS.RUNNING);
      });

      it('dismisses the toast once a later tick recovers', async () => {
        getTenantProvisioningStatusActionMock.mockResolvedValue(
          mockProvisioningStatusResult(),
        );

        await advance(STEP_POLL_INTERVAL_MS + MOCK_TOAST_EXIT_BUFFER_MS);
        const warning = screen.queryByText(POLL_ERROR_WARNING);

        expect(warning).not.toBeInTheDocument();
      });
    });
  });

  describe('dispatch', () => {
    it('dispatches the workflow and reports no error on success', async () => {
      const { result } = renderPoll(mockClientTenant());

      act(() => {
        result.current.handleDispatch();
      });

      await waitFor(() => {
        expect(result.current.isDispatchPending).toBe(false);
      });
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(result.current.dispatchNotice).toBeUndefined();
    });

    it.each([
      [
        TENANT_REFUSAL.NOT_FOUND,
        { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
      ],
      [
        TENANT_REFUSAL.ARCHIVED,
        { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED },
      ],
      [
        TENANT_REFUSAL.ALREADY_IN_PROGRESS,
        {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
        },
      ],
      [ACTION_OUTCOME.SERVER_ERROR, { outcome: ACTION_OUTCOME.SERVER_ERROR }],
    ] as const)(
      'reports %s as the dispatch notice and stops pending',
      async (dispatchNotice, actionResult) => {
        retryProvisioningStepActionMock.mockResolvedValue(actionResult);
        const { result } = renderPoll(mockClientTenant());

        act(() => {
          result.current.handleDispatch();
        });

        await waitFor(() => {
          expect(result.current.dispatchNotice).toBe(dispatchNotice);
        });
        expect(result.current.isDispatchPending).toBe(false);
      },
    );

    it('shows an in-flight dispatch on an all-idle tenant as RUNNING', async () => {
      retryProvisioningStepActionMock.mockReturnValue(new Promise(() => {}));
      const { result } = renderPoll(mockClientTenant());

      act(() => {
        result.current.handleDispatch();
      });

      await waitFor(() => {
        expect(result.current.isProvisioningRunning).toBe(true);
      });
      expect(result.current.displayOverallStatus).toBe(STEP_STATUS.RUNNING);
      expect(result.current.isOverallFailed).toBe(false);
    });
  });
});
