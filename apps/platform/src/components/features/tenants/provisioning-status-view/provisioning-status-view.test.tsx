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
  fireEvent,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  idleProvisioningSteps,
  makeClientTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const render = renderWithIntl;

const STEP_POLL_INTERVAL_MS = 1500;
const STEP_REVEAL_DWELL_MS = 800;

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

describe(ProvisioningStatusView, () => {
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

  it('never lets a rendered poll loop schedule a real setInterval, even for a test that never advances timers', () => {
    const tenant = makeClientTenant();
    expect(vi.getTimerCount()).toBe(0);

    const { unmount } = render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(vi.isFakeTimers()).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('titles the page "Provisioning" and names the tenant in the description', () => {
    const tenant = makeClientTenant({ name: 'Acme Inc.' });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const provisioningHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Provisioning',
    });

    expect(provisioningHeading).toBeVisible();
    const acmeIncEachText = screen.getByText(
      'Acme Inc. · each step is independently resumable.',
    );

    expect(acmeIncEachText).toBeVisible();
  });

  it('shows the archived notice for a deprovisioned tenant', () => {
    const tenant = makeClientTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const thisTenantIsText = screen.getByText('This tenant is archived');

    expect(thisTenantIsText).toBeVisible();
  });

  it('does not show the archived notice for a live tenant', () => {
    const tenant = makeClientTenant({ deprovisionedAt: null });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const thisTenantIsText = screen.queryByText('This tenant is archived');

    expect(thisTenantIsText).not.toBeInTheDocument();
  });

  it('renders the overall status badge in the Run card header, not the page header', () => {
    const tenant = makeClientTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const runningText = within(
      screen.getByRole('heading', { name: 'Provisioning' }),
    ).queryByText('Running…');

    expect(runningText).not.toBeInTheDocument();
    const runningText2 = within(
      screen.getByTestId('run-status-live'),
    ).getByText('Running…');

    expect(runningText2).toBeVisible();
  });

  it('shows the invited-pending owner badge when the tenant has no resolved owner email', () => {
    const tenant = makeClientTenant();
    render(<ProvisioningStatusView tenant={tenant} ownerEmail={undefined} />);

    const ownerText = screen.getByText('Owner');

    expect(ownerText).toBeVisible();
    const invitedPendingText = screen.getByText('Invited, pending');

    expect(invitedPendingText).toBeVisible();
  });

  it('hides the invited-pending owner badge once the tenant has a resolved owner email', () => {
    const tenant = makeClientTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const invitedPendingText = screen.queryByText('Invited, pending');

    expect(invitedPendingText).not.toBeInTheDocument();
  });

  it('renders no complementary landmark around the main content', () => {
    const tenant = makeClientTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const complementary = screen.queryByRole('complementary');

    expect(complementary).not.toBeInTheDocument();
  });

  it('titles the steps card "Steps" and shows a 0-of-6-done badge when every step is idle', () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const sidebar = screen.getByTestId('provisioning-steps');
    const stepsHeading = within(sidebar).getByRole('heading', {
      level: 2,
      name: /^Steps/,
    });

    expect(stepsHeading).toBeVisible();
    const n0Of6Text = within(sidebar).getByText('0 of 6 done');

    expect(n0Of6Text).toBeVisible();
  });

  it("reflects the steps card's completion badge count from the tenant's actual step statuses", () => {
    const tenant = makeClientTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const n2Of6Text = within(
      screen.getByTestId('provisioning-steps'),
    ).getByText('2 of 6 done');

    expect(n2Of6Text).toBeVisible();
  });

  it('lists all six provisioning steps in order, in operator language', () => {
    const tenant = makeClientTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

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

  it('shows the current status for a running step', () => {
    const tenant = makeClientTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const firstRunningText = screen.getAllByText('Running…')[0];

    expect(firstRunningText).toBeVisible();
  });

  it("shows a running step's number in its circle instead of a spinner", () => {
    const tenant = makeClientTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const statusList = screen.queryAllByRole('status');

    expect(statusList).toHaveLength(0);
    const n1Text = screen.getByText('1', {
      selector: 'span[aria-hidden="true"]',
    });

    expect(n1Text).toBeVisible();
  });

  it('exposes exactly one accessible announcement per step across all four statuses', () => {
    const tenant = makeClientTenant({
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
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const statusList = screen.queryAllByRole('status');

    expect(statusList).toHaveLength(0);

    for (const text of ['Not started', 'Running…', 'Complete', 'Failed']) {
      for (const element of screen.getAllByText(text)) {
        expect(element).not.toHaveAttribute('aria-hidden');
      }
    }

    const n1Text = screen.getByText('1', {
      selector: 'span[aria-hidden="true"]',
    });

    expect(n1Text).toBeVisible();
    const n2Text = screen.getByText('2', {
      selector: 'span[aria-hidden="true"]',
    });

    expect(n2Text).toBeVisible();
    const checkMark = screen.getByText('✓', {
      selector: 'span[aria-hidden="true"]',
    });

    expect(checkMark).toBeVisible();
    const failureMark = screen.getByText('!', {
      selector: 'span[aria-hidden="true"]',
    });

    expect(failureMark).toBeVisible();
  });

  it('shows a single Retry button in the Run card header for a failed step, with no per-step Retry buttons in the sidebar', () => {
    const tenant = makeClientTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error:
            'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error',
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const retryProvisioningButtons = screen.getAllByRole('button', {
      name: 'Retry provisioning',
    });

    expect(retryProvisioningButtons).toHaveLength(1);
    const retryProvisioningButton = within(
      screen.getByTestId('provisioning-steps'),
    ).queryByRole('button', {
      name: 'Retry provisioning',
    });

    expect(retryProvisioningButton).not.toBeInTheDocument();
    const failedTexts = screen.getAllByText('Failed');

    expect(failedTexts).toHaveLength(2);
  });

  it("no longer renders a step's raw error text inline in the sidebar", () => {
    const tenant = makeClientTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error:
            'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error',
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const vercelApiPostText = within(
      screen.getByTestId('provisioning-steps'),
    ).queryByText(
      'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error',
    );

    expect(vercelApiPostText).not.toBeInTheDocument();
  });

  it('does not render a parsed error card when no step has failed', () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const alert = screen.queryByRole('alert');

    expect(alert).not.toBeInTheDocument();
  });

  describe('parsed provisioning error card', () => {
    const renderFailed = (error: string) => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );
    };

    it('maps a 403 permission failure to a friendly headline and next step, with the raw text under Technical details', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/invites failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}';
      renderFailed(rawError);

      const missingPermissionToCompleteHeading = screen.getByRole('heading', {
        name: 'Missing permission to complete this step',
      });

      expect(missingPermissionToCompleteHeading).toBeVisible();
      const grantTheMissingText = screen.getByText(
        'Grant the missing permission, then retry.',
      );

      expect(grantTheMissingText).toBeVisible();
      const technicalDetailsText = screen.getByText('Technical details');

      expect(technicalDetailsText).toBeVisible();
      const rawErrorElement = screen.getByText(rawError);

      expect(rawErrorElement).not.toBeVisible();
    });

    it('maps a 400 duplicate/already-in-use failure to a friendly headline and next step', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}';
      renderFailed(rawError);

      const alreadyInUseByHeading = screen.getByRole('heading', {
        name: 'Already in use by another tenant',
      });

      expect(alreadyInUseByHeading).toBeVisible();
      const resolveTheConflictText = screen.getByText(
        'Resolve the conflict, then retry.',
      );

      expect(resolveTheConflictText).toBeVisible();
    });

    it('maps a network/timeout failure to a friendly headline and next step', () => {
      renderFailed('fetch failed');

      const couldNotReachTheHeading = screen.getByRole('heading', {
        name: "Couldn't reach the provisioning service",
      });

      expect(couldNotReachTheHeading).toBeVisible();
      const waitAMomentText = screen.getByText('Wait a moment, then retry.');

      expect(waitAMomentText).toBeVisible();
    });

    it('falls back to a generic friendly headline and preserved raw text for an unrecognised failure shape', () => {
      const rawError = 'CORS API is down';
      renderFailed(rawError);

      const thisStepFailedHeading = screen.getByRole('heading', {
        name: 'This step failed',
      });

      expect(thisStepFailedHeading).toBeVisible();
      const retryOrCheckText = screen.getByText(
        'Retry, or check the technical details before asking for help.',
      );

      expect(retryOrCheckText).toBeVisible();
      const rawErrorElement = screen.getByText(rawError);

      expect(rawErrorElement).not.toBeVisible();
    });
  });

  describe('a stale FAILED step while a retried run is genuinely in progress', () => {
    const staleFailedTenant = () =>
      makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'Vercel Domains API returned 500',
          },
        },
      });

    it('shows a running indicator, not the stale Failed state, in the overall status badge', () => {
      render(
        <ProvisioningStatusView
          tenant={staleFailedTenant()}
          ownerEmail="owner@example.com"
        />,
      );

      const runningCount = screen.getAllByText('Running…').length;

      expect(runningCount).toBeGreaterThan(0);
      const failedText = screen.queryByText('Failed');

      expect(failedText).not.toBeInTheDocument();
      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });

    it('renders the stale step with its pending number instead of the failed glyph', () => {
      render(
        <ProvisioningStatusView
          tenant={staleFailedTenant()}
          ownerEmail="owner@example.com"
        />,
      );

      const failureMark = screen.queryByText('!', {
        selector: 'span[aria-hidden="true"]',
      });

      expect(failureMark).not.toBeInTheDocument();
      const n4Text = screen.getByText('4', {
        selector: 'span[aria-hidden="true"]',
      });

      expect(n4Text).toBeVisible();
    });

    it('shows no Retry button while the run is genuinely in progress', () => {
      render(
        <ProvisioningStatusView
          tenant={staleFailedTenant()}
          ownerEmail="owner@example.com"
        />,
      );

      const retryProvisioningButton = screen.queryByRole('button', {
        name: 'Retry provisioning',
      });

      expect(retryProvisioningButton).not.toBeInTheDocument();
    });
  });

  it('re-dispatches the workflow for this tenant when Retry is clicked', async () => {
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
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Retry provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('shows a Start provisioning action when every step is idle', () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const startProvisioningButtons = screen.getAllByRole('button', {
      name: 'Start provisioning',
    });

    expect(startProvisioningButtons).toHaveLength(1);
  });

  it('says no run has started yet in the Run card before any run exists', () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const noRunHasText = screen.getByText('No run has started yet.');

    expect(noRunHasText).toBeVisible();
  });

  it('hides the Start provisioning action once any step has progressed past idle', () => {
    const tenant = makeClientTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const startProvisioningButton = screen.queryByRole('button', {
      name: 'Start provisioning',
    });

    expect(startProvisioningButton).not.toBeInTheDocument();
  });

  it('re-dispatches the workflow for this tenant when Start provisioning is clicked', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('immediately hides Start and shows the running badge before the dispatch resolves', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    let resolveDispatch: TMaybeUndefined<
      (result: { outcome: typeof ACTION_OUTCOME.SUCCESS }) => void
    >;
    retryProvisioningStepActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDispatch = resolve;
      }),
    );
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const startProvisioningButton = screen.queryByRole('button', {
      name: 'Start provisioning',
    });

    expect(startProvisioningButton).not.toBeInTheDocument();
    const runningCount = screen.getAllByText('Running…').length;

    expect(runningCount).toBeGreaterThan(0);

    await act(async () => {
      resolveDispatch?.({ outcome: ACTION_OUTCOME.SUCCESS });
      await Promise.resolve();
    });
  });

  it('mounts the overall status live region before Start is ever clicked, so the first status change is announced', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    let resolveDispatch: TMaybeUndefined<
      (result: { outcome: typeof ACTION_OUTCOME.SUCCESS }) => void
    >;
    retryProvisioningStepActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDispatch = resolve;
      }),
    );
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const liveRegion = screen.getByTestId('run-status-live');
    const notStartedText = within(liveRegion).getByText('Not started');

    expect(notStartedText).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const runningText = within(liveRegion).getByText('Running…');

    expect(runningText).toBeVisible();

    await act(async () => {
      resolveDispatch?.({ outcome: ACTION_OUTCOME.SUCCESS });
      await Promise.resolve();
    });
  });

  it('shows a distinguishable error and re-enables Start when the dispatch fails, reverting the optimistic running state', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const couldNotStartText = await screen.findByText(
      "Couldn't start provisioning — try again.",
    );

    expect(couldNotStartText).toBeVisible();
    const startProvisioningButton = await screen.findByRole('button', {
      name: 'Start provisioning',
    });

    expect(startProvisioningButton).toBeVisible();
  });

  it('shows a not-found-specific error when the tenant no longer exists server-side', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const couldNotFindText = await screen.findByText(
      "Couldn't find this tenant — refresh the page and try again.",
    );

    expect(couldNotFindText).toBeVisible();
  });

  it('shows a distinct, non-error notice when a run is already in progress', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const aProvisioningRunText = await screen.findByText(
      'A provisioning run is already in progress for this tenant — this page will update automatically once it finishes.',
    );

    expect(aProvisioningRunText).toBeVisible();
    const alert = screen.queryByRole('alert');

    expect(alert).not.toBeInTheDocument();
  });

  it('disables Start provisioning for an archived tenant, and never dispatches on click', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const startButton = screen.getByRole('button', {
      name: 'Start provisioning',
    });
    expect(startButton).toBeDisabled();

    await user.click(startButton);
    expect(retryProvisioningStepActionMock).not.toHaveBeenCalled();
  });

  it('disables Retry provisioning for an archived tenant, and never dispatches on click', async () => {
    const tenant = makeClientTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API returned 500',
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const retryButton = screen.getByRole('button', {
      name: 'Retry provisioning',
    });
    expect(retryButton).toBeDisabled();

    await user.click(retryButton);
    expect(retryProvisioningStepActionMock).not.toHaveBeenCalled();
  });

  it('describes the disabled Start button with the archived notice, for a screen-reader user', () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const startProvisioningButton = screen.getByRole('button', {
      name: 'Start provisioning',
    });

    expect(startProvisioningButton).toHaveAccessibleDescription(
      /This tenant is archived/,
    );
  });

  it('describes the disabled Retry button with the archived notice, for a screen-reader user', () => {
    const tenant = makeClientTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API returned 500',
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const retryProvisioningButton = screen.getByRole('button', {
      name: 'Retry provisioning',
    });

    expect(retryProvisioningButton).toHaveAccessibleDescription(
      /This tenant is archived/,
    );
  });

  it('shows an archived-specific error if a dispatch is somehow still attempted against an archived tenant', async () => {
    const tenant = makeClientTenant({
      provisioningSteps: idleProvisioningSteps(),
    });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    const thisTenantIsText = await screen.findByText(
      "This tenant is archived; provisioning can't be started.",
    );

    expect(thisTenantIsText).toBeVisible();
  });

  describe('live polling', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls for fresh status while provisioning is not terminal, and re-renders on a new result', async () => {
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByTestId('provisioning-steps');
      const runningText = within(sidebar).getByText('Running…');

      expect(runningText).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      const completeText = within(sidebar).getByText('Complete');

      expect(completeText).toBeVisible();
      const runningText2 = within(sidebar).queryByText('Running…');

      expect(runningText2).not.toBeInTheDocument();
    });

    it('announces a polled step-status transition through a stable aria-live region', async () => {
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const liveRegion = screen.getByTestId(
        `step-status-live-${TENANT_PROVISIONING_STEP.SANITY_PROJECT}`,
      );
      const runningText = within(liveRegion).getByText('Running…');

      expect(runningText).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
      });

      const completeText = within(liveRegion).getByText('Complete');

      expect(completeText).toBeVisible();
    });
    it('shows a step that finished between two polls as running before it shows as complete', async () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const liveRegion = screen.getByTestId(
        `step-status-live-${TENANT_PROVISIONING_STEP.SANITY_PROJECT}`,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
      });

      const runningText = within(liveRegion).getByText('Running…');

      expect(runningText).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
      });

      const completeText = within(liveRegion).getByText('Complete');

      expect(completeText).toBeVisible();
    });

    it('says the run is queued, with a wait that keeps counting, until the workflow starts it', async () => {
      vi.setSystemTime(new Date('2026-10-15T13:00:05.000Z'));
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: { admittedAt: '2026-10-15T13:00:00.000Z' } as TProvisioningRun,
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const queuedTheProvisioningText = screen.getByText(
        'Queued — the provisioning workflow is starting up',
      );

      expect(queuedTheProvisioningText).toBeVisible();
      const queuedRunElapsed = screen.getByTestId('queued-run-elapsed');

      expect(queuedRunElapsed).toHaveTextContent('0:05 waiting');
      const startingText = within(
        screen.getByTestId('run-status-live'),
      ).getByText('Starting…');

      expect(startingText).toBeVisible();
      const queuedText = within(
        screen.getByTestId(
          `step-status-live-${TENANT_PROVISIONING_STEP.SANITY_PROJECT}`,
        ),
      ).getByText('Queued');

      expect(queuedText).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      const queuedRunElapsed2 = screen.getByTestId('queued-run-elapsed');

      expect(queuedRunElapsed2).toHaveTextContent('1:05 waiting');
    });

    it('drops the queued notice once the workflow has started the run', async () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: { admittedAt: '2026-10-15T13:00:00.000Z' } as TProvisioningRun,
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: { startedAt: '2026-10-15T13:01:00.000Z' },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      const queuedTheProvisioningText = screen.queryByText(
        'Queued — the provisioning workflow is starting up',
      );

      expect(queuedTheProvisioningText).not.toBeInTheDocument();
      const runningText = within(
        screen.getByTestId('run-status-live'),
      ).getByText('Running…');

      expect(runningText).toBeVisible();
    });
  });

  describe('steps disclosure collapse', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    const stepsToggle = () =>
      within(screen.getByTestId('provisioning-steps')).getByRole('button', {
        name: /Steps/,
      });

    it('is expanded while the run is not done', () => {
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      expect(stepsToggle()).toHaveAttribute('aria-expanded', 'true');
    });

    it('is collapsed by default once every step is already done on mount', () => {
      const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
      const tenant = makeClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
          [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
          [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: done,
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      expect(stepsToggle()).toHaveAttribute('aria-expanded', 'false');
    });

    it('auto-collapses once the run completes, and a later re-render does not undo a user-initiated reopen', async () => {
      const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
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
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
          [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
          [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: done,
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const disclosure = stepsToggle();
      expect(disclosure).toHaveAttribute('aria-expanded', 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      for (let reveal = 0; reveal < 11; reveal += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
        });
      }

      expect(disclosure).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(disclosure);
      expect(disclosure).toHaveAttribute('aria-expanded', 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('step and run timestamps', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows a done step's updatedAt as relative time, keeping the full ISO in dateTime", () => {
      vi.setSystemTime(new Date('2026-08-12T14:25:00.000Z'));
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const timestamp = screen.getByText('6m ago');
      expect(timestamp.tagName).toBe('TIME');
      expect(timestamp).toHaveAttribute('dateTime', '2026-08-12T14:19:00.000Z');
    });

    it("keeps a step's timestamp outside the aria-live status region", () => {
      vi.setSystemTime(new Date('2026-08-12T14:25:00.000Z'));
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const liveRegions = [
        ...screen.getAllByTestId(/^step-status-live-/),
        screen.getByTestId('run-status-live'),
      ];
      expect(liveRegions.length).toBeGreaterThan(0);
      for (const region of liveRegions) {
        expect(region).not.toHaveTextContent('6m ago');
      }
    });

    it("shows a failed step's updatedAt as relative time, keeping the full ISO in dateTime", () => {
      vi.setSystemTime(new Date('2026-08-12T14:25:00.000Z'));
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
            updatedAt: '2026-08-12T14:20:00.000Z',
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const timestamp = screen.getByText('5m ago');
      expect(timestamp.tagName).toBe('TIME');
      expect(timestamp).toHaveAttribute('dateTime', '2026-08-12T14:20:00.000Z');
    });

    it('shows "now" for a running step instead of a timestamp', () => {
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const nowText = screen.getByText('now');
      expect(nowText).toBeVisible();
      expect(nowText.tagName).not.toBe('TIME');
    });

    it('shows no timestamp for a done step with no recorded updatedAt', () => {
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const d4Text = screen.queryByText(/\d{4}/);

      expect(d4Text).not.toBeInTheDocument();
    });

    it('renders a Run card header with no run details for a tenant with no run', () => {
      const tenant = makeClientTenant({
        provisioningSteps: idleProvisioningSteps(),
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });

      expect(runHeading).toBeVisible();
      const startedText = screen.queryByText('Started');

      expect(startedText).not.toBeInTheDocument();
      const finishedText = screen.queryByText('Finished');

      expect(finishedText).not.toBeInTheDocument();
    });

    it('renders a Run card with Started/Finished/Registry when the run exists, each showing relative and absolute UTC time together', () => {
      vi.setSystemTime(new Date('2026-08-12T14:24:00.000Z'));
      const tenant = makeClientTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:22:00.000Z',
            registry: 'production',
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });

      expect(runHeading).toBeVisible();
      const n6mAgoAugText = screen.getByText(
        '6m ago · Aug 12, 2026, 2:18 PM UTC',
      );

      expect(n6mAgoAugText).toBeVisible();
      const n2mAgoAugText = screen.getByText(
        '2m ago · Aug 12, 2026, 2:22 PM UTC',
      );

      expect(n2mAgoAugText).toBeVisible();
      const productionText = screen.getByText('production');

      expect(productionText).toBeVisible();
    });
  });
});
