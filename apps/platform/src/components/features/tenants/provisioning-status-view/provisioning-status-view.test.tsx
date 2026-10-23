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
  fireEvent,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  idleProvisioningSteps,
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OWNER_EMAIL,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_4_MIN_AT,
  MOCK_RUN_PLUS_6_MIN_AT,
  MOCK_RUN_PLUS_7_MIN_AT,
  MOCK_RUN_STARTED_AT,
  mockDoneProvisioningSteps,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const STEP_POLL_INTERVAL_MS = 1500;
const STEP_REVEAL_DWELL_MS = 800;

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const THIS_TENANT_IS_ARCHIVED = 'This tenant is archived';
const RUN_STATUS_LIVE = 'run-status-live';
const INVITED_PENDING = 'Invited, pending';
const PROVISIONING_STEPS = 'provisioning-steps';
const HIDDEN_ICON_SELECTOR = 'span[aria-hidden="true"]';
const NOT_STARTED = 'Not started';
const VERCEL_DOMAINS_FAILURE =
  'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error';
const RETRY_PROVISIONING = 'Retry provisioning';
const DOMAINS_API_ERROR = 'Vercel Domains API returned 500';
const START_PROVISIONING = 'Start provisioning';
const AT_20261015_1300 = '2026-10-15T13:00:00.000Z';
const QUEUED_PROVISIONING_WORKFLOW_STARTING_UP =
  'Queued — the provisioning workflow is starting up';
const QUEUED_RUN_ELAPSED = 'queued-run-elapsed';
const ARIA_EXPANDED = 'aria-expanded';
const RUNNING = 'Running…';
const FIRST_STEP_LIVE = `step-status-live-${TENANT_PROVISIONING_STEP.SANITY_PROJECT}`;

const renderView = customRender(ProvisioningStatusView, {
  tenant: makeClientTenant(),
  ownerEmail: MOCK_OWNER_EMAIL,
});

const firstStepRunningSteps = () => ({
  ...idleProvisioningSteps(),
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  },
});

const firstStepDoneSteps = () => ({
  ...idleProvisioningSteps(),
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
});

const mapDomainFailedSteps = (error = DOMAINS_API_ERROR) => ({
  ...idleProvisioningSteps(),
  [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error,
  },
});

const failedRunTenant = (error = DOMAINS_API_ERROR) =>
  makeClientTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    provisioningSteps: mapDomainFailedSteps(error),
  });

const provisioningFirstStepRunningTenant = () =>
  makeClientTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    provisioningSteps: firstStepRunningSteps(),
  });

const queuedRunTenant = () =>
  makeClientTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    provisioningSteps: {
      ...idleProvisioningSteps(),
      run: { admittedAt: AT_20261015_1300 } as TProvisioningRun,
    },
  });

const pollAndReveal = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
  });
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

  const clickStartResolvingWith = async (
    result: Awaited<ReturnType<typeof retryProvisioningStepAction>>,
  ) => {
    retryProvisioningStepActionMock.mockResolvedValue(result);
    renderView();
    await user.click(screen.getByRole('button', { name: START_PROVISIONING }));
  };

  it('never lets a rendered poll loop schedule a real setInterval, even for a test that never advances timers', () => {
    expect(vi.getTimerCount()).toBe(0);

    const { unmount } = renderView();

    expect(vi.isFakeTimers()).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('titles the page "Provisioning" and names the tenant in the description', () => {
    renderView({ tenant: makeClientTenant({ name: 'Acme Inc.' }) });

    const provisioningHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Provisioning',
    });
    const acmeIncEachText = screen.getByText(
      'Acme Inc. · each step is independently resumable.',
    );

    expect(provisioningHeading).toBeVisible();
    expect(acmeIncEachText).toBeVisible();
  });

  it('does not show the archived notice for a live tenant', () => {
    renderView({ tenant: makeClientTenant({ deprovisionedAt: null }) });

    const thisTenantIsText = screen.queryByText(THIS_TENANT_IS_ARCHIVED);

    expect(thisTenantIsText).not.toBeInTheDocument();
  });

  it('renders the overall status badge in the Run card header, not the page header', () => {
    renderView({
      tenant: makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...firstStepRunningSteps(),
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      }),
    });

    const runningText = within(
      screen.getByRole('heading', { name: 'Provisioning' }),
    ).queryByText(RUNNING);
    const runningText2 = within(screen.getByTestId(RUN_STATUS_LIVE)).getByText(
      RUNNING,
    );

    expect(runningText).not.toBeInTheDocument();
    expect(runningText2).toBeVisible();
  });

  it('shows the invited-pending owner badge when the tenant has no resolved owner email', () => {
    renderView({ ownerEmail: undefined });

    const ownerText = screen.getByText('Owner');
    const invitedPendingText = screen.getByText(INVITED_PENDING);

    expect(ownerText).toBeVisible();
    expect(invitedPendingText).toBeVisible();
  });

  describe('with every step idle', () => {
    beforeEach(() => {
      renderView();
    });

    it('hides the invited-pending owner badge once the tenant has a resolved owner email', () => {
      const invitedPendingText = screen.queryByText(INVITED_PENDING);

      expect(invitedPendingText).not.toBeInTheDocument();
    });

    it('renders no complementary landmark around the main content', () => {
      const complementary = screen.queryByRole('complementary');

      expect(complementary).not.toBeInTheDocument();
    });

    it('titles the steps card "Steps" and shows a 0-of-6-done badge when every step is idle', () => {
      const sidebar = screen.getByTestId(PROVISIONING_STEPS);
      const stepsHeading = within(sidebar).getByRole('heading', {
        level: 2,
        name: /^Steps/,
      });
      const n0Of6Text = within(sidebar).getByText('0 of 6 done');

      expect(stepsHeading).toBeVisible();
      expect(n0Of6Text).toBeVisible();
    });

    it('lists all six provisioning steps in order, in operator language', () => {
      const headings = [
        'Create workspace',
        'Seed content',
        'Issue read credentials',
        'Connect domain',
        'Wire up CMS to website',
        'Confirm content is ready',
      ];
      for (const heading of headings) {
        const headingElement = screen.getByText(heading);

        expect(headingElement).toBeVisible();
      }
    });

    it('does not render a parsed error card when no step has failed', () => {
      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });

    it('shows a Start provisioning action when every step is idle', () => {
      const startProvisioningButtons = screen.getAllByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startProvisioningButtons).toHaveLength(1);
    });

    it('says no run has started yet in the Run card before any run exists', () => {
      const noRunHasText = screen.getByText('No run has started yet.');

      expect(noRunHasText).toBeVisible();
    });

    it('re-dispatches the workflow for this tenant when Start provisioning is clicked', async () => {
      await user.click(
        screen.getByRole('button', { name: START_PROVISIONING }),
      );

      await waitFor(() => {
        expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(TENANT_ID);
      });
    });
  });

  it("reflects the steps card's completion badge count from the tenant's actual step statuses", () => {
    renderView({
      tenant: makeClientTenant({
        provisioningSteps: {
          ...firstStepDoneSteps(),
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      }),
    });

    const n2Of6Text = within(screen.getByTestId(PROVISIONING_STEPS)).getByText(
      '2 of 6 done',
    );

    expect(n2Of6Text).toBeVisible();
  });

  describe('with the first step running', () => {
    beforeEach(() => {
      renderView({
        tenant: makeClientTenant({
          provisioningSteps: firstStepRunningSteps(),
        }),
      });
    });

    it('shows the current status for a running step', () => {
      const firstRunningText = screen.getAllByText(RUNNING)[0];

      expect(firstRunningText).toBeVisible();
    });

    it("shows a running step's number in its circle instead of a spinner", () => {
      const statusList = screen.queryAllByRole('status');
      const n1Text = screen.getByText('1', {
        selector: HIDDEN_ICON_SELECTOR,
      });

      expect(statusList).toHaveLength(0);
      expect(n1Text).toBeVisible();
    });

    it('hides the Start provisioning action once any step has progressed past idle', () => {
      const startProvisioningButton = screen.queryByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startProvisioningButton).not.toBeInTheDocument();
    });
  });

  it('exposes exactly one accessible announcement per step across all four statuses', () => {
    renderView({
      tenant: makeClientTenant({
        provisioningSteps: {
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
          },
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel deploy failed',
          },
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
            status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
          },
          [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
          },
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
            status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
          },
        },
      }),
    });

    const statusList = screen.queryAllByRole('status');

    expect(statusList).toHaveLength(0);

    for (const text of [NOT_STARTED, RUNNING, 'Complete', 'Failed']) {
      for (const element of screen.getAllByText(text)) {
        expect(element).not.toHaveAttribute('aria-hidden');
      }
    }

    const n1Text = screen.getByText('1', {
      selector: HIDDEN_ICON_SELECTOR,
    });
    const n2Text = screen.getByText('2', {
      selector: HIDDEN_ICON_SELECTOR,
    });
    const checkMark = screen.getByText('✓', {
      selector: HIDDEN_ICON_SELECTOR,
    });
    const failureMark = screen.getByText('!', {
      selector: HIDDEN_ICON_SELECTOR,
    });

    expect(n1Text).toBeVisible();
    expect(n2Text).toBeVisible();
    expect(checkMark).toBeVisible();
    expect(failureMark).toBeVisible();
  });

  it('shows a single Retry button in the Run card header for a failed step, with no per-step Retry buttons in the sidebar', () => {
    renderView({ tenant: failedRunTenant(VERCEL_DOMAINS_FAILURE) });

    const retryProvisioningButtons = screen.getAllByRole('button', {
      name: RETRY_PROVISIONING,
    });
    const retryProvisioningButton = within(
      screen.getByTestId(PROVISIONING_STEPS),
    ).queryByRole('button', {
      name: RETRY_PROVISIONING,
    });
    const failedTexts = screen.getAllByText('Failed');

    expect(retryProvisioningButtons).toHaveLength(1);
    expect(retryProvisioningButton).not.toBeInTheDocument();
    expect(failedTexts).toHaveLength(2);
  });

  it("no longer renders a step's raw error text inline in the sidebar", () => {
    renderView({
      tenant: makeClientTenant({
        provisioningSteps: mapDomainFailedSteps(VERCEL_DOMAINS_FAILURE),
      }),
    });

    const vercelApiPostText = within(
      screen.getByTestId(PROVISIONING_STEPS),
    ).queryByText(VERCEL_DOMAINS_FAILURE);

    expect(vercelApiPostText).not.toBeInTheDocument();
  });

  describe('parsed provisioning error card', () => {
    const renderFailed = (error: string) => {
      renderView({
        tenant: makeClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
          provisioningSteps: {
            ...idleProvisioningSteps(),
            [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
              status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
              error,
            },
          },
        }),
      });
    };

    it('maps a 403 permission failure to a friendly headline and next step, with the raw text under Technical details', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/invites failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}';
      renderFailed(rawError);

      const missingPermissionToCompleteHeading = screen.getByRole('heading', {
        name: 'Missing permission to complete this step',
      });
      const grantTheMissingText = screen.getByText(
        'Grant the missing permission, then retry.',
      );
      const technicalDetailsText = screen.getByText('Technical details');
      const rawErrorElement = screen.getByText(rawError);

      expect(missingPermissionToCompleteHeading).toBeVisible();
      expect(grantTheMissingText).toBeVisible();
      expect(technicalDetailsText).toBeVisible();
      expect(rawErrorElement).not.toBeVisible();
    });

    it('maps a 400 duplicate/already-in-use failure to a friendly headline and next step', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}';
      renderFailed(rawError);

      const alreadyInUseByHeading = screen.getByRole('heading', {
        name: 'Already in use by another tenant',
      });
      const resolveTheConflictText = screen.getByText(
        'Resolve the conflict, then retry.',
      );

      expect(alreadyInUseByHeading).toBeVisible();
      expect(resolveTheConflictText).toBeVisible();
    });

    it('maps a network/timeout failure to a friendly headline and next step', () => {
      renderFailed('fetch failed');

      const couldNotReachTheHeading = screen.getByRole('heading', {
        name: "Couldn't reach the provisioning service",
      });
      const waitAMomentText = screen.getByText('Wait a moment, then retry.');

      expect(couldNotReachTheHeading).toBeVisible();
      expect(waitAMomentText).toBeVisible();
    });

    it('falls back to a generic friendly headline and preserved raw text for an unrecognised failure shape', () => {
      const rawError = 'CORS API is down';
      renderFailed(rawError);

      const thisStepFailedHeading = screen.getByRole('heading', {
        name: 'This step failed',
      });
      const retryOrCheckText = screen.getByText(
        'Retry, or check the technical details before asking for help.',
      );
      const rawErrorElement = screen.getByText(rawError);

      expect(thisStepFailedHeading).toBeVisible();
      expect(retryOrCheckText).toBeVisible();
      expect(rawErrorElement).not.toBeVisible();
    });
  });

  describe('a stale FAILED step while a retried run is genuinely in progress', () => {
    beforeEach(() => {
      renderView({
        tenant: makeClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
          provisioningSteps: mapDomainFailedSteps(),
        }),
      });
    });

    it('shows a running indicator, not the stale Failed state, in the overall status badge', () => {
      const runningCount = screen.getAllByText(RUNNING).length;
      const failedText = screen.queryByText('Failed');
      const alert = screen.queryByRole('alert');

      expect(runningCount).toBeGreaterThan(0);
      expect(failedText).not.toBeInTheDocument();
      expect(alert).not.toBeInTheDocument();
    });

    it('renders the stale step with its pending number instead of the failed glyph', () => {
      const failureMark = screen.queryByText('!', {
        selector: HIDDEN_ICON_SELECTOR,
      });
      const n4Text = screen.getByText('4', {
        selector: HIDDEN_ICON_SELECTOR,
      });

      expect(failureMark).not.toBeInTheDocument();
      expect(n4Text).toBeVisible();
    });

    it('shows no Retry button while the run is genuinely in progress', () => {
      const retryProvisioningButton = screen.queryByRole('button', {
        name: RETRY_PROVISIONING,
      });

      expect(retryProvisioningButton).not.toBeInTheDocument();
    });
  });

  it('re-dispatches the workflow for this tenant when Retry is clicked', async () => {
    renderView({ tenant: failedRunTenant() });

    await user.click(screen.getByRole('button', { name: RETRY_PROVISIONING }));

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(TENANT_ID);
    });
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
      renderView();
    });

    afterEach(async () => {
      await act(async () => {
        resolveDispatch?.({ outcome: ACTION_OUTCOME.SUCCESS });
        await Promise.resolve();
      });
    });

    it('immediately hides Start and shows the running badge before the dispatch resolves', async () => {
      await user.click(
        screen.getByRole('button', { name: START_PROVISIONING }),
      );

      const startProvisioningButton = screen.queryByRole('button', {
        name: START_PROVISIONING,
      });
      const runningCount = screen.getAllByText(RUNNING).length;

      expect(startProvisioningButton).not.toBeInTheDocument();
      expect(runningCount).toBeGreaterThan(0);
    });

    it('mounts the overall status live region before Start is ever clicked, so the first status change is announced', async () => {
      const liveRegion = screen.getByTestId(RUN_STATUS_LIVE);
      const notStartedText = within(liveRegion).getByText(NOT_STARTED);

      expect(notStartedText).toBeVisible();

      await user.click(
        screen.getByRole('button', { name: START_PROVISIONING }),
      );

      const runningText = within(liveRegion).getByText(RUNNING);

      expect(runningText).toBeVisible();
    });
  });

  it('shows a distinguishable error and re-enables Start when the dispatch fails, reverting the optimistic running state', async () => {
    await clickStartResolvingWith({ outcome: ACTION_OUTCOME.SERVER_ERROR });

    const couldNotStartText = await screen.findByText(
      "Couldn't start provisioning — try again.",
    );
    const startProvisioningButton = await screen.findByRole('button', {
      name: START_PROVISIONING,
    });

    expect(couldNotStartText).toBeVisible();
    expect(startProvisioningButton).toBeVisible();
  });

  it('shows a not-found-specific error when the tenant no longer exists server-side', async () => {
    await clickStartResolvingWith({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });

    const couldNotFindText = await screen.findByText(
      "Couldn't find this tenant — refresh the page and try again.",
    );

    expect(couldNotFindText).toBeVisible();
  });

  it('shows a distinct, non-error notice when a run is already in progress', async () => {
    await clickStartResolvingWith({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });

    const aProvisioningRunText = await screen.findByText(
      'A provisioning run is already in progress for this tenant — this page will update automatically once it finishes.',
    );
    const alert = screen.queryByRole('alert');

    expect(aProvisioningRunText).toBeVisible();
    expect(alert).not.toBeInTheDocument();
  });

  it('shows an archived-specific error if a dispatch is somehow still attempted against an archived tenant', async () => {
    await clickStartResolvingWith({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });

    const thisTenantIsText = await screen.findByText(
      "This tenant is archived; provisioning can't be started.",
    );

    expect(thisTenantIsText).toBeVisible();
  });

  describe('for an archived tenant with every step idle', () => {
    beforeEach(() => {
      renderView({
        tenant: makeClientTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      });
    });

    it('shows the archived notice for a deprovisioned tenant', () => {
      const thisTenantIsText = screen.getByText(THIS_TENANT_IS_ARCHIVED);

      expect(thisTenantIsText).toBeVisible();
    });

    it('disables Start provisioning for an archived tenant, and never dispatches on click', async () => {
      const startButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });
      expect(startButton).toBeDisabled();

      await user.click(startButton);
      expect(retryProvisioningStepActionMock).not.toHaveBeenCalled();
    });

    it('describes the disabled Start button with the archived notice, for a screen-reader user', () => {
      const startProvisioningButton = screen.getByRole('button', {
        name: START_PROVISIONING,
      });

      expect(startProvisioningButton).toHaveAccessibleDescription(
        /This tenant is archived/,
      );
    });
  });

  describe('for an archived tenant with a failed step', () => {
    beforeEach(() => {
      renderView({
        tenant: makeClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
          deprovisionedAt: MOCK_ARCHIVED_AT,
          provisioningSteps: mapDomainFailedSteps(),
        }),
      });
    });

    it('disables Retry provisioning for an archived tenant, and never dispatches on click', async () => {
      const retryButton = screen.getByRole('button', {
        name: RETRY_PROVISIONING,
      });
      expect(retryButton).toBeDisabled();

      await user.click(retryButton);
      expect(retryProvisioningStepActionMock).not.toHaveBeenCalled();
    });

    it('describes the disabled Retry button with the archived notice, for a screen-reader user', () => {
      const retryProvisioningButton = screen.getByRole('button', {
        name: RETRY_PROVISIONING,
      });

      expect(retryProvisioningButton).toHaveAccessibleDescription(
        /This tenant is archived/,
      );
    });
  });

  describe('live polling', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('with the first step running and a poll that completes it', () => {
      beforeEach(() => {
        getTenantProvisioningStatusActionMock.mockResolvedValue({
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
          provisioningSteps: firstStepDoneSteps(),
        });
        renderView({ tenant: provisioningFirstStepRunningTenant() });
      });

      it('polls for fresh status while provisioning is not terminal, and re-renders on a new result', async () => {
        const sidebar = screen.getByTestId(PROVISIONING_STEPS);
        const runningText = within(sidebar).getByText(RUNNING);

        expect(runningText).toBeVisible();

        await pollAndReveal();

        expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
          TENANT_ID,
        );
        const completeText = within(sidebar).getByText('Complete');
        const runningText2 = within(sidebar).queryByText(RUNNING);

        expect(completeText).toBeVisible();
        expect(runningText2).not.toBeInTheDocument();
      });

      it('announces a polled step-status transition through a stable aria-live region', async () => {
        const liveRegion = screen.getByTestId(FIRST_STEP_LIVE);
        const runningText = within(liveRegion).getByText(RUNNING);

        expect(runningText).toBeVisible();

        await pollAndReveal();

        const completeText = within(liveRegion).getByText('Complete');

        expect(completeText).toBeVisible();
      });
    });

    it('shows a step that finished between two polls as running before it shows as complete', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: firstStepDoneSteps(),
      });
      renderView({
        tenant: makeClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        }),
      });

      const liveRegion = screen.getByTestId(FIRST_STEP_LIVE);

      await pollAndReveal();

      const runningText = within(liveRegion).getByText(RUNNING);

      expect(runningText).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
      });

      const completeText = within(liveRegion).getByText('Complete');

      expect(completeText).toBeVisible();
    });

    it('says the run is queued, with a wait that keeps counting, until the workflow starts it', async () => {
      vi.setSystemTime(new Date('2026-10-15T13:00:05.000Z'));
      renderView({ tenant: queuedRunTenant() });

      const queuedTheProvisioningText = screen.getByText(
        QUEUED_PROVISIONING_WORKFLOW_STARTING_UP,
      );
      const queuedRunElapsed = screen.getByTestId(QUEUED_RUN_ELAPSED);
      const startingText = within(
        screen.getByTestId(RUN_STATUS_LIVE),
      ).getByText('Starting…');
      const queuedText = within(screen.getByTestId(FIRST_STEP_LIVE)).getByText(
        'Queued',
      );

      expect(queuedTheProvisioningText).toBeVisible();
      expect(queuedRunElapsed).toHaveTextContent('0:05 waiting');
      expect(startingText).toBeVisible();
      expect(queuedText).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      const queuedRunElapsed2 = screen.getByTestId(QUEUED_RUN_ELAPSED);

      expect(queuedRunElapsed2).toHaveTextContent('1:05 waiting');
    });

    it('drops the queued notice once the workflow has started the run', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: { startedAt: '2026-10-15T13:01:00.000Z' },
        },
      });
      renderView({ tenant: queuedRunTenant() });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      const queuedTheProvisioningText = screen.queryByText(
        QUEUED_PROVISIONING_WORKFLOW_STARTING_UP,
      );
      const runningText = within(screen.getByTestId(RUN_STATUS_LIVE)).getByText(
        RUNNING,
      );

      expect(queuedTheProvisioningText).not.toBeInTheDocument();
      expect(runningText).toBeVisible();
    });
  });

  describe('steps disclosure collapse', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    const stepsToggle = () =>
      within(screen.getByTestId(PROVISIONING_STEPS)).getByRole('button', {
        name: /Steps/,
      });

    it('is expanded while the run is not done', () => {
      renderView({ tenant: provisioningFirstStepRunningTenant() });

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('is collapsed by default once every step is already done on mount', () => {
      renderView({
        tenant: makeClientTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
          provisioningSteps: mockDoneProvisioningSteps(),
        }),
      });

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('auto-collapses once the run completes, and a later re-render does not undo a user-initiated reopen', async () => {
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: mockDoneProvisioningSteps(),
      });
      renderView({ tenant: provisioningFirstStepRunningTenant() });

      const disclosure = stepsToggle();
      expect(disclosure).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      for (let reveal = 0; reveal < 11; reveal += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
        });
      }

      expect(disclosure).toHaveAttribute(ARIA_EXPANDED, 'false');

      fireEvent.click(disclosure);
      expect(disclosure).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(disclosure).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });

  describe('step and run timestamps', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('seven minutes into the run', () => {
      beforeEach(() => {
        vi.setSystemTime(new Date(MOCK_RUN_PLUS_7_MIN_AT));
      });

      describe('with the first step done a minute in', () => {
        beforeEach(() => {
          renderView({
            tenant: makeClientTenant({
              provisioningSteps: {
                ...idleProvisioningSteps(),
                [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
                  status: TENANT_PROVISIONING_STEP_STATUS.DONE,
                  updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
                },
              },
            }),
          });
        });

        it("shows a done step's updatedAt as relative time, keeping the full ISO in dateTime", () => {
          const timestamp = screen.getByText('6m ago');
          expect(timestamp.tagName).toBe('TIME');
          expect(timestamp).toHaveAttribute('dateTime', MOCK_RUN_PLUS_1_MIN_AT);
        });

        it("keeps a step's timestamp outside the aria-live status region", () => {
          const liveRegions = [
            ...screen.getAllByTestId(/^step-status-live-/),
            screen.getByTestId(RUN_STATUS_LIVE),
          ];
          expect(liveRegions.length).toBeGreaterThan(0);
          for (const region of liveRegions) {
            expect(region).not.toHaveTextContent('6m ago');
          }
        });
      });

      it("shows a failed step's updatedAt as relative time, keeping the full ISO in dateTime", () => {
        renderView({
          tenant: makeClientTenant({
            provisioningSteps: {
              ...idleProvisioningSteps(),
              [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
                status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
                error: 'boom',
                updatedAt: MOCK_RUN_PLUS_2_MIN_AT,
              },
            },
          }),
        });

        const timestamp = screen.getByText('5m ago');
        expect(timestamp.tagName).toBe('TIME');
        expect(timestamp).toHaveAttribute('dateTime', MOCK_RUN_PLUS_2_MIN_AT);
      });
    });

    it('shows "now" for a running step instead of a timestamp', () => {
      renderView({
        tenant: makeClientTenant({
          provisioningSteps: firstStepRunningSteps(),
        }),
      });

      const nowText = screen.getByText('now');
      expect(nowText).toBeVisible();
      expect(nowText.tagName).not.toBe('TIME');
    });

    it('shows no timestamp for a done step with no recorded updatedAt', () => {
      renderView({
        tenant: makeClientTenant({ provisioningSteps: firstStepDoneSteps() }),
      });

      const d4Text = screen.queryByText(/\d{4}/);

      expect(d4Text).not.toBeInTheDocument();
    });

    it('renders a Run card header with no run details for a tenant with no run', () => {
      renderView();

      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });
      const startedText = screen.queryByText('Started');
      const finishedText = screen.queryByText('Finished');

      expect(runHeading).toBeVisible();
      expect(startedText).not.toBeInTheDocument();
      expect(finishedText).not.toBeInTheDocument();
    });

    it('renders a Run card with Started/Finished/Registry when the run exists, each showing relative and absolute UTC time together', () => {
      vi.setSystemTime(new Date(MOCK_RUN_PLUS_6_MIN_AT));
      renderView({
        tenant: makeClientTenant({
          provisioningSteps: {
            ...idleProvisioningSteps(),
            run: {
              startedAt: MOCK_RUN_STARTED_AT,
              finishedAt: MOCK_RUN_PLUS_4_MIN_AT,
              registry: 'production',
            },
          },
        }),
      });

      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });
      const n6mAgoAugText = screen.getByText(
        '6m ago · Aug 12, 2026, 2:18 PM UTC',
      );
      const n2mAgoAugText = screen.getByText(
        '2m ago · Aug 12, 2026, 2:22 PM UTC',
      );
      const productionText = screen.getByText('production');

      expect(runHeading).toBeVisible();
      expect(n6mAgoAugText).toBeVisible();
      expect(n2mAgoAugText).toBeVisible();
      expect(productionText).toBeVisible();
    });
  });
});
