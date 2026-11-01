import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import {
  act,
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ARCHIVED_NOTICE_TEXT,
} from '@platform/testing/render-in-settings-form';
import {
  mockIdleProvisioningSteps,
  INVITED_PENDING_TEXT,
  mockClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OWNER_EMAIL,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_7_MIN_AT,
  MOCK_RUN_STARTED_AT,
  MOCK_TENANT_NAME,
  mockDoneProvisioningSteps,
  mockFirstStepDoneProvisioningSteps,
  mockFirstStepRunningProvisioningSteps,
  mockMapDomainFailedProvisioningSteps,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { STEP_POLL_INTERVAL_MS } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { STEP_REVEAL_DWELL_MS } from '@platform/utils/use-staged-step-statuses/use-staged-step-statuses';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const ONE_MINUTE_MS = 60_000;
const QUEUED_WAIT_MS = 5000;
const REVEALS_UNTIL_ALL_DONE = 11;

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const RUN_STATUS_LIVE = 'run-status-live';
const PROVISIONING_STEPS = 'provisioning-steps';
const QUEUED_RUN_ELAPSED = 'queued-run-elapsed';
const FIRST_STEP_LIVE = `step-status-live-${TENANT_PROVISIONING_STEP.SANITY_PROJECT}`;
const NOT_STARTED = 'Not started';
const RUNNING = 'Running…';
const START_PROVISIONING = 'Start provisioning';
const RETRY_PROVISIONING = 'Retry provisioning';
const STEPS_TOGGLE_NAME = /Steps/;
const ARIA_EXPANDED = 'aria-expanded';
const QUEUED_NOTICE = 'Queued — the provisioning workflow is starting up';
const MOCK_DOMAINS_FAILURE =
  'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error';
const MOCK_QUEUED_ADMITTED_AT = '2026-10-15T13:00:00.000Z';
const MOCK_QUEUED_STARTED_AT = '2026-10-15T13:01:00.000Z';
const FINISHED_PENDING = '—';
const MOCK_FINISHED_RUN = {
  startedAt: MOCK_RUN_STARTED_AT,
  finishedAt: MOCK_RUN_PLUS_7_MIN_AT,
} as TProvisioningRun;

const MOCK_FAILED_TENANT = mockClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
  provisioningSteps: mockMapDomainFailedProvisioningSteps(MOCK_DOMAINS_FAILURE),
});

const MOCK_FIRST_STEP_RUNNING_TENANT = mockClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
  provisioningSteps: mockFirstStepRunningProvisioningSteps(),
});

const MOCK_QUEUED_TENANT = mockClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
  provisioningSteps: {
    ...mockIdleProvisioningSteps(),
    run: { admittedAt: MOCK_QUEUED_ADMITTED_AT } as TProvisioningRun,
  },
});

const MOCK_ARCHIVED_IDLE_TENANT = mockClientTenant({
  deprovisionedAt: MOCK_ARCHIVED_AT,
});

const MOCK_ARCHIVED_FAILED_TENANT = mockClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
  deprovisionedAt: MOCK_ARCHIVED_AT,
  provisioningSteps: mockMapDomainFailedProvisioningSteps(MOCK_DOMAINS_FAILURE),
});

const setup = customRender(ProvisioningStatusView, {
  tenant: mockClientTenant(),
  ownerEmail: MOCK_OWNER_EMAIL,
});

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const pollAndReveal = async () => {
  await advance(STEP_POLL_INTERVAL_MS);
  await advance(STEP_REVEAL_DWELL_MS);
};

describe(`<${ProvisioningStatusView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    user = userEvent.setup();
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('titles the page and names the tenant in the description', () => {
    setup({ tenant: mockClientTenant({ name: MOCK_TENANT_NAME }) });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Provisioning',
    });
    const description = screen.getByText(
      `${MOCK_TENANT_NAME} · each step is independently resumable.`,
    );

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
  });

  it('shows the run status in the Run card, not the page header', () => {
    setup({
      tenant: mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockFirstStepRunningProvisioningSteps(),
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      }),
    });

    const pageHeading = screen.getByRole('heading', { name: 'Provisioning' });
    const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
    const headerBadge = within(pageHeading).queryByText(RUNNING);
    const cardBadge = within(runStatusLive).getByText(RUNNING);

    expect(headerBadge).not.toBeInTheDocument();
    expect(cardBadge).toBeVisible();
  });

  it('shows the invited-pending owner badge when no owner email is resolved', () => {
    setup({ ownerEmail: undefined });

    const ownerLabel = screen.getByText('Owner');
    const invitedPending = screen.getByText(INVITED_PENDING_TEXT);

    expect(ownerLabel).toBeVisible();
    expect(invitedPending).toBeVisible();
  });

  it('hides the invited-pending owner badge once the owner email is resolved', () => {
    setup();

    const invitedPending = screen.queryByText(INVITED_PENDING_TEXT);

    expect(invitedPending).not.toBeInTheDocument();
  });

  it('counts the done steps from the tenant step statuses', () => {
    setup({
      tenant: mockClientTenant({
        provisioningSteps: {
          ...mockFirstStepDoneProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      }),
    });

    const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
    const completionBadge = within(stepsCard).getByText('2 of 6 done');

    expect(completionBadge).toBeVisible();
  });

  describe('with every step idle', () => {
    beforeEach(() => {
      setup();
    });

    it('lists all six provisioning steps in operator language', () => {
      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const stepTitles = [
        'Create workspace',
        'Seed content',
        'Issue read credentials',
        'Connect domain',
        'Wire up CMS to website',
        'Confirm content is ready',
      ].map((title) => within(stepsCard).getByText(title));

      for (const stepTitle of stepTitles) {
        expect(stepTitle).toBeVisible();
      }
    });

    it('shows no error card and no live-region landmark noise', () => {
      const alert = screen.queryByRole('alert');
      const complementary = screen.queryByRole('complementary');

      expect(alert).not.toBeInTheDocument();
      expect(complementary).not.toBeInTheDocument();
    });

    it('offers a single Start provisioning action', () => {
      const startButtons = screen.getAllByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startButtons).toHaveLength(1);
    });

    it('dispatches the workflow for this tenant when Start is clicked', async () => {
      const startButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });
      await user.click(startButton);

      await waitFor(() => {
        expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
      });
    });
  });

  describe('with the first step running', () => {
    beforeEach(() => {
      setup({ tenant: MOCK_FIRST_STEP_RUNNING_TENANT });
    });

    it('shows the running status on the first step', () => {
      const firstStepLive = screen.getByTestId(FIRST_STEP_LIVE);
      const runningStatus = within(firstStepLive).getByText(RUNNING);

      expect(runningStatus).toBeVisible();
    });

    it('hides Start once any step has progressed past idle', () => {
      const startButton = screen.queryByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startButton).not.toBeInTheDocument();
    });
  });

  describe('with a failed step', () => {
    it('offers one Retry in the Run card and none among the steps', () => {
      setup({ tenant: MOCK_FAILED_TENANT });

      const retryButtons = screen.getAllByRole('button', {
        name: RETRY_PROVISIONING,
      });
      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const stepsRetryButton = within(stepsCard).queryByRole('button', {
        name: RETRY_PROVISIONING,
      });

      expect(retryButtons).toHaveLength(1);
      expect(stepsRetryButton).not.toBeInTheDocument();
    });

    it('keeps the raw error text out of the steps list', () => {
      setup({ tenant: MOCK_FAILED_TENANT });

      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const rawError = within(stepsCard).queryByText(MOCK_DOMAINS_FAILURE);

      expect(rawError).not.toBeInTheDocument();
    });

    it('dispatches the workflow for this tenant when Retry is clicked', async () => {
      setup({ tenant: MOCK_FAILED_TENANT });

      const retryButton = screen.getByRole('button', {
        name: RETRY_PROVISIONING,
      });
      await user.click(retryButton);

      await waitFor(() => {
        expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
      });
    });
  });

  describe('with a stale failed step while a retried run is in progress', () => {
    beforeEach(() => {
      setup({
        tenant: mockClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
          provisioningSteps:
            mockMapDomainFailedProvisioningSteps(MOCK_DOMAINS_FAILURE),
        }),
      });
    });

    it('shows the run as running, not failed', () => {
      const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
      const runningStatus = within(runStatusLive).getByText(RUNNING);
      const failedStatus = screen.queryByText('Failed');
      const alert = screen.queryByRole('alert');

      expect(runningStatus).toBeVisible();
      expect(failedStatus).not.toBeInTheDocument();
      expect(alert).not.toBeInTheDocument();
    });

    it('offers no Retry', () => {
      const retryButton = screen.queryByRole('button', {
        name: RETRY_PROVISIONING,
      });

      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('error card for a failed step', () => {
    it.each([
      {
        failure: 'a permission failure',
        rawError:
          'Sanity Access API POST /access/project/xxxxx000/invites failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}',
        headline: 'Missing permission to complete this step',
        nextStep: 'Grant the missing permission, then retry.',
      },
      {
        failure: 'an already-in-use failure',
        rawError:
          'Sanity Access API POST /access/project/xxxxx000/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}',
        headline: 'Already in use by another tenant',
        nextStep: 'Resolve the conflict, then retry.',
      },
      {
        failure: 'a network failure',
        rawError: 'fetch failed',
        headline: "Couldn't reach the provisioning service",
        nextStep: 'Wait a moment, then retry.',
      },
      {
        failure: 'an unrecognised failure',
        rawError: 'CORS API is down',
        headline: 'This step failed',
        nextStep:
          'Retry, or check the technical details before asking for help.',
      },
    ])(
      'explains $failure and keeps the raw text under technical details',
      ({ rawError, headline, nextStep }) => {
        setup({
          tenant: mockClientTenant({
            provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
            provisioningSteps: {
              ...mockIdleProvisioningSteps(),
              [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
                status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
                error: rawError,
              },
            },
          }),
        });

        const headlineElement = screen.getByRole('heading', { name: headline });
        const nextStepElement = screen.getByText(nextStep);
        const technicalDetails = screen.getByText('Technical details');
        const rawErrorElement = screen.getByText(rawError);

        expect(headlineElement).toBeVisible();
        expect(nextStepElement).toBeVisible();
        expect(technicalDetails).toBeVisible();
        expect(rawErrorElement).not.toBeVisible();
      },
    );
  });

  describe('while the Start dispatch is still pending', () => {
    let resolveDispatch: TMaybeUndefined<
      (result: { outcome: typeof ACTION_OUTCOME.SUCCESS }) => void
    >;

    beforeEach(() => {
      retryProvisioningStepActionMock.mockReturnValue(
        new Promise((resolve) => {
          resolveDispatch = resolve;
        }),
      );
      setup();
    });

    afterEach(async () => {
      resolveDispatch?.({ outcome: ACTION_OUTCOME.SUCCESS });
      await advance(0);
    });

    it('hides Start and shows the run as running at once', async () => {
      const startButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });
      await user.click(startButton);

      const removedStartButton = screen.queryByRole('button', {
        name: START_PROVISIONING,
      });
      const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
      const runningStatus = within(runStatusLive).getByText(RUNNING);

      expect(removedStartButton).not.toBeInTheDocument();
      expect(runningStatus).toBeVisible();
    });

    it('announces the first status change from a live region mounted before it', async () => {
      const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
      const notStarted = within(runStatusLive).getByText(NOT_STARTED);

      expect(notStarted).toBeVisible();

      const startButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });
      await user.click(startButton);

      const runningStatus = within(runStatusLive).getByText(RUNNING);

      expect(runningStatus).toBeVisible();
    });
  });

  describe('when the Start dispatch is refused or fails', () => {
    const startResolvingWith = async (
      result: Awaited<ReturnType<typeof retryProvisioningStepAction>>,
    ) => {
      retryProvisioningStepActionMock.mockResolvedValue(result);
      setup();
      const startButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });
      await user.click(startButton);
    };

    it.each([
      {
        cause: 'an unexpected failure',
        result: { outcome: ACTION_OUTCOME.SERVER_ERROR },
        message: "Couldn't start provisioning — try again.",
      },
      {
        cause: 'a tenant that no longer exists',
        result: {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.NOT_FOUND,
        },
        message: "Couldn't find this tenant — refresh the page and try again.",
      },
      {
        cause: 'an archived tenant',
        result: {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.ARCHIVED,
        },
        message: "This tenant is archived; provisioning can't be started.",
      },
    ] as const)('explains $cause', async ({ result, message }) => {
      await startResolvingWith(result);

      const notice = await screen.findByText(message);

      expect(notice).toBeVisible();
    });

    it('re-enables Start after an unexpected failure', async () => {
      await startResolvingWith({ outcome: ACTION_OUTCOME.SERVER_ERROR });

      const startButton = await screen.findByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startButton).toBeVisible();
    });

    it('explains a run already in progress without raising an alert', async () => {
      await startResolvingWith({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      });

      const notice = await screen.findByText(
        'A provisioning run is already in progress for this tenant — this page will update automatically once it finishes.',
      );
      const alert = screen.queryByRole('alert');

      expect(notice).toBeVisible();
      expect(alert).not.toBeInTheDocument();
    });
  });

  describe('for an archived tenant', () => {
    it('shows the archived notice', () => {
      setup({ tenant: MOCK_ARCHIVED_IDLE_TENANT });

      const notice = screen.getByText(ARCHIVED_NOTICE_TEXT);

      expect(notice).toBeVisible();
    });

    it('shows no archived notice for a live tenant', () => {
      setup();

      const notice = screen.queryByText(ARCHIVED_NOTICE_TEXT);

      expect(notice).not.toBeInTheDocument();
    });

    describe.each([
      {
        action: START_PROVISIONING,
        tenant: MOCK_ARCHIVED_IDLE_TENANT,
      },
      {
        action: RETRY_PROVISIONING,
        tenant: MOCK_ARCHIVED_FAILED_TENANT,
      },
    ])('$action', ({ action, tenant }) => {
      beforeEach(() => {
        setup({ tenant });
      });

      it('is disabled and never dispatches on click', async () => {
        const button = screen.getByRole('button', { name: action });
        expect(button).toBeDisabled();

        await user.click(button);

        expect(retryProvisioningStepActionMock).not.toHaveBeenCalled();
      });

      it('is described by the archived notice', () => {
        const button = screen.getByRole('button', { name: action });

        expect(button).toHaveAccessibleDescription(ARCHIVED_NOTICE_DESCRIPTION);
      });
    });
  });

  describe('live polling', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    it('re-renders the steps from a fresh poll result', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockFirstStepDoneProvisioningSteps(),
      });
      setup({ tenant: MOCK_FIRST_STEP_RUNNING_TENANT });

      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const runningStatus = within(stepsCard).getByText(RUNNING);

      expect(runningStatus).toBeVisible();

      await pollAndReveal();

      const completeStatus = within(stepsCard).getByText('Complete');
      const removedRunningStatus = within(stepsCard).queryByText(RUNNING);

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(completeStatus).toBeVisible();
      expect(removedRunningStatus).not.toBeInTheDocument();
    });

    it('collapses the steps once the polled run completes', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: mockDoneProvisioningSteps(),
      });
      setup({ tenant: MOCK_FIRST_STEP_RUNNING_TENANT });

      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const stepsToggle = within(stepsCard).getByRole('button', {
        name: STEPS_TOGGLE_NAME,
      });

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');

      await advance(STEP_POLL_INTERVAL_MS);
      for (let reveal = 0; reveal < REVEALS_UNTIL_ALL_DONE; reveal += 1) {
        await advance(STEP_REVEAL_DWELL_MS);
      }

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('shows the run as finished only once every step shows done', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: {
          ...mockDoneProvisioningSteps(),
          run: MOCK_FINISHED_RUN,
        },
      });
      setup({ tenant: MOCK_FIRST_STEP_RUNNING_TENANT });

      await advance(STEP_POLL_INTERVAL_MS);

      const pendingFinish = screen.getByText(FINISHED_PENDING);

      expect(pendingFinish).toBeVisible();

      for (let reveal = 0; reveal < REVEALS_UNTIL_ALL_DONE - 1; reveal += 1) {
        await advance(STEP_REVEAL_DWELL_MS);
      }

      const stillPendingFinish = screen.getByText(FINISHED_PENDING);

      expect(stillPendingFinish).toBeVisible();

      await advance(STEP_REVEAL_DWELL_MS);

      const removedPendingFinish = screen.queryByText(FINISHED_PENDING);

      expect(removedPendingFinish).not.toBeInTheDocument();
    });

    it('shows a reloaded finished run as finished at once', () => {
      setup({
        tenant: mockClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
          provisioningSteps: {
            ...mockDoneProvisioningSteps(),
            run: MOCK_FINISHED_RUN,
          },
        }),
      });

      const pendingFinish = screen.queryByText(FINISHED_PENDING);
      const stepsCard = screen.getByTestId(PROVISIONING_STEPS);
      const runningStatus = within(stepsCard).queryByText(RUNNING);

      expect(pendingFinish).not.toBeInTheDocument();
      expect(runningStatus).not.toBeInTheDocument();
    });

    it('counts the wait of a queued run until the workflow starts it', async () => {
      vi.setSystemTime(
        new Date(Date.parse(MOCK_QUEUED_ADMITTED_AT) + QUEUED_WAIT_MS),
      );
      setup({ tenant: MOCK_QUEUED_TENANT });

      const queuedNotice = screen.getByText(QUEUED_NOTICE);
      const queuedElapsed = screen.getByTestId(QUEUED_RUN_ELAPSED);
      const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
      const startingStatus = within(runStatusLive).getByText('Starting…');

      expect(queuedNotice).toBeVisible();
      expect(queuedElapsed).toHaveTextContent('0:05 waiting');
      expect(startingStatus).toBeVisible();

      await advance(ONE_MINUTE_MS);

      const laterElapsed = screen.getByTestId(QUEUED_RUN_ELAPSED);

      expect(laterElapsed).toHaveTextContent('1:05 waiting');
    });

    it('drops the queued notice once the workflow has started the run', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          run: { startedAt: MOCK_QUEUED_STARTED_AT },
        },
      });
      setup({ tenant: MOCK_QUEUED_TENANT });

      await advance(STEP_POLL_INTERVAL_MS);

      const removedQueuedNotice = screen.queryByText(QUEUED_NOTICE);
      const runStatusLive = screen.getByTestId(RUN_STATUS_LIVE);
      const runningStatus = within(runStatusLive).getByText(RUNNING);

      expect(removedQueuedNotice).not.toBeInTheDocument();
      expect(runningStatus).toBeVisible();
    });
  });

  describe('step times', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      vi.setSystemTime(new Date(MOCK_RUN_PLUS_7_MIN_AT));
    });

    it("dates a done step from the tenant's recorded update", () => {
      setup({
        tenant: mockClientTenant({
          provisioningSteps: {
            ...mockIdleProvisioningSteps(),
            [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
              status: TENANT_PROVISIONING_STEP_STATUS.DONE,
              updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
            },
          },
        }),
      });

      const stepAge = screen.getByText('6m ago');

      expect(stepAge).toBeVisible();
    });
  });
});
