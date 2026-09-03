import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { TOAST_EXIT_ANIMATION_MS } from '@platform/context/toast-provider';
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
  makeTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const render = renderWithIntl;

const STEP_POLL_INTERVAL_MS = 4000;
// Mirrors the component's own `RETRY_BASELINE_MAX_TICKS`.
const RETRY_BASELINE_MAX_TICKS = 75;

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

// `useProvisioningPoll` still imports this module for a caller that passes a
// real domain status (`TenantOverviewView`) — mocked here purely to keep this
// component's render test from loading that chain, same reasoning as
// `deprovision-tenant-control.test.tsx` does for its own imports.
vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

describe(ProvisioningStatusView, () => {
  // Most tests render a non-terminal `provisioningStatus`, which starts a
  // real `setInterval` poll loop that can outlive this test's cleanup under
  // `pool: 'forks'` load and fire against a torn-down file. Faking
  // setInterval/clearInterval closes that off.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatched',
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('never lets a rendered poll loop schedule a real setInterval, even for a test that never advances timers', () => {
    const tenant = makeTenant();
    expect(vi.getTimerCount()).toBe(0);

    const { unmount } = render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(vi.isFakeTimers()).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('titles the page "Provisioning" and names the tenant in the description', () => {
    const tenant = makeTenant({ name: 'Acme Inc.' });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Provisioning' }),
    ).toBeVisible();
    expect(
      screen.getByText('Acme Inc. · each step is independently resumable.'),
    ).toBeVisible();
  });

  it('shows the archived notice for a deprovisioned tenant', () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(screen.getByText('This tenant is archived')).toBeVisible();
  });

  it('does not show the archived notice for a live tenant', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });

  it("keeps an overall status badge in the page header even before the body's own status row appears", () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Provisioning',
    });
    expect(
      within(heading.parentElement as HTMLElement).getByText('Not started'),
    ).toBeVisible();
  });

  it('always shows a Back to tenant link to the tenant overview, regardless of provisioning status', () => {
    const readyTenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });
    const { unmount } = render(
      <ProvisioningStatusView
        tenant={readyTenant}
        ownerEmail="owner@example.com"
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Back to tenant' }),
    ).toHaveAttribute('href', '/tenants/tenant-1');
    unmount();

    const provisioningTenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });
    render(
      <ProvisioningStatusView
        tenant={provisioningTenant}
        ownerEmail="owner@example.com"
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Back to tenant' }),
    ).toHaveAttribute('href', '/tenants/tenant-1');
  });

  it('shows the invited-pending owner badge when the tenant has no resolved owner email', () => {
    const tenant = makeTenant();
    render(<ProvisioningStatusView tenant={tenant} ownerEmail={undefined} />);

    expect(screen.getByText('Owner')).toBeVisible();
    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('hides the invited-pending owner badge once the tenant has a resolved owner email', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(screen.queryByText('Invited, pending')).not.toBeInTheDocument();
  });

  it('renders the steps column as a semantic aside landmark', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('titles the steps card "Steps" and shows a 0-of-5-done badge when every step is idle', () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const sidebar = screen.getByRole('complementary');
    expect(
      within(sidebar).getByRole('heading', { level: 2, name: 'Steps' }),
    ).toBeVisible();
    expect(within(sidebar).getByText('0 of 5 done')).toBeVisible();
  });

  it("reflects the steps card's completion badge count from the tenant's actual step statuses", () => {
    const tenant = makeTenant({
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

    expect(
      within(screen.getByRole('complementary')).getByText('2 of 5 done'),
    ).toBeVisible();
  });

  it('lists all five provisioning steps in order, in operator language', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    const headings = [
      'Create workspace',
      'Seed content',
      'Issue read credentials',
      'Connect domain',
      'Wire up CMS to website',
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeVisible();
    }
  });

  it('shows the current status for a running step', () => {
    const tenant = makeTenant({
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

    expect(screen.getAllByText('Running…')[0]).toBeVisible();
  });

  it("shows a running step's number in its circle instead of a spinner", () => {
    const tenant = makeTenant({
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

    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(
      screen.getByText('1', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('exposes exactly one accessible announcement per step across all four statuses', () => {
    const tenant = makeTenant({
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
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      },
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    // No spinner anywhere — the badge text is the sole accessible source now.
    expect(screen.queryAllByRole('status')).toHaveLength(0);

    for (const text of ['Not started', 'Running…', 'Complete', 'Failed']) {
      for (const element of screen.getAllByText(text)) {
        expect(element).not.toHaveAttribute('aria-hidden');
      }
    }

    // Every circle glyph is aria-hidden regardless of status — it's purely
    // decorative now that the badge carries the announcement.
    expect(
      screen.getByText('1', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('2', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('✓', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('!', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('shows a single Retry button in the tenant details header for a failed step, with no per-step Retry buttons in the sidebar', () => {
    const tenant = makeTenant({
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

    expect(
      screen.getAllByRole('button', { name: 'Retry provisioning' }),
    ).toHaveLength(1);
    expect(
      within(screen.getByRole('complementary')).queryByRole('button', {
        name: 'Retry provisioning',
      }),
    ).not.toBeInTheDocument();
    // One "Failed" per the failed step's visually-hidden sidebar
    // announcement, one for the page header's overall status badge, and one
    // for the tenant details header's own overall status badge.
    expect(screen.getAllByText('Failed')).toHaveLength(3);
  });

  it("no longer renders a step's raw error text inline in the sidebar", () => {
    const tenant = makeTenant({
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

    expect(
      within(screen.getByRole('complementary')).queryByText(
        'Vercel API POST /v9/projects/prj_web/domains failed: 500 internal_server_error',
      ),
    ).not.toBeInTheDocument();
  });

  it('does not render a parsed error card when no step has failed', () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('parsed provisioning error card', () => {
    const renderFailed = (error: string) => {
      const tenant = makeTenant({
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

      expect(
        screen.getByRole('heading', {
          name: 'Missing permission to complete this step',
        }),
      ).toBeVisible();
      expect(
        screen.getByText('Grant the missing permission, then retry.'),
      ).toBeVisible();
      expect(screen.getByText('Technical details')).toBeVisible();
      expect(screen.getByText(rawError)).toBeInTheDocument();
    });

    it('maps a 400 duplicate/already-in-use failure to a friendly headline and next step', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}';
      renderFailed(rawError);

      expect(
        screen.getByRole('heading', {
          name: 'Already in use by another tenant',
        }),
      ).toBeVisible();
      expect(
        screen.getByText('Resolve the conflict, then retry.'),
      ).toBeVisible();
    });

    it('maps a network/timeout failure to a friendly headline and next step', () => {
      renderFailed('fetch failed');

      expect(
        screen.getByRole('heading', {
          name: "Couldn't reach the provisioning service",
        }),
      ).toBeVisible();
      expect(screen.getByText('Wait a moment, then retry.')).toBeVisible();
    });

    it('falls back to a generic friendly headline and preserved raw text for an unrecognised failure shape', () => {
      const rawError = 'CORS API is down';
      renderFailed(rawError);

      expect(
        screen.getByRole('heading', { name: 'This step failed' }),
      ).toBeVisible();
      expect(
        screen.getByText(
          'Retry, or check the technical details before asking for help.',
        ),
      ).toBeVisible();
      expect(screen.getByText(rawError)).toBeInTheDocument();
    });
  });

  it('re-dispatches the workflow for this tenant when Retry is clicked', async () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API returned 500',
        },
      },
    });
    const user = userEvent.setup();
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
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(
      screen.getAllByRole('button', { name: 'Start provisioning' }),
    ).toHaveLength(1);
  });

  it('hides the Start provisioning action once any step has progressed past idle', () => {
    const tenant = makeTenant({
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

    expect(
      screen.queryByRole('button', { name: 'Start provisioning' }),
    ).not.toBeInTheDocument();
  });

  it('re-dispatches the workflow for this tenant when Start provisioning is clicked', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    const user = userEvent.setup();
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
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    let resolveDispatch:
      ((result: { outcome: 'dispatched' }) => void) | undefined;
    retryProvisioningStepActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDispatch = resolve;
      }),
    );
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    // Still pending — the dispatch promise hasn't resolved yet, but the
    // operator already sees it's running rather than a frozen page.
    expect(
      screen.queryByRole('button', { name: 'Start provisioning' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Running…').length).toBeGreaterThan(0);

    await act(async () => {
      resolveDispatch?.({ outcome: 'dispatched' });
      await Promise.resolve();
    });
  });

  it('shows a distinguishable error and re-enables Start when the dispatch fails, reverting the optimistic running state', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatch-error',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    expect(
      await screen.findByText("Couldn't start provisioning — try again."),
    ).toBeVisible();
    expect(
      await screen.findByRole('button', { name: 'Start provisioning' }),
    ).toBeInTheDocument();
  });

  it('shows a not-found-specific error when the tenant no longer exists server-side', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'not-found',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    expect(
      await screen.findByText(
        "Couldn't find this tenant — refresh the page and try again.",
      ),
    ).toBeVisible();
  });

  it('treats "already-in-progress" as a no-op — no error shown, dispatch still reported', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'already-in-progress',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables Start provisioning for an archived tenant, and never dispatches on click', async () => {
    const tenant = makeTenant({
      provisioningSteps: idleProvisioningSteps(),
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    const user = userEvent.setup();
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
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API returned 500',
        },
      },
    });
    const user = userEvent.setup();
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
    const tenant = makeTenant({
      provisioningSteps: idleProvisioningSteps(),
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    expect(
      screen.getByRole('button', { name: 'Start provisioning' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
  });

  it('describes the disabled Retry button with the archived notice, for a screen-reader user', () => {
    const tenant = makeTenant({
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

    expect(
      screen.getByRole('button', { name: 'Retry provisioning' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
  });

  it('shows an archived-specific error if a dispatch is somehow still attempted against an archived tenant', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'archived',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView tenant={tenant} ownerEmail="owner@example.com" />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    expect(
      await screen.findByText(
        "This tenant is archived; provisioning can't be started.",
      ),
    ).toBeVisible();
  });

  describe('live polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls for fresh status while provisioning is not terminal, and re-renders on a new result', async () => {
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(within(sidebar).getByText('Complete')).toBeVisible();
      expect(within(sidebar).queryByText('Running…')).not.toBeInTheDocument();
    });

    it('announces a polled step-status transition through a stable aria-live region', async () => {
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      const liveRegionBefore = within(sidebar)
        .getByText('Running…')
        .closest('[aria-live="polite"]');
      expect(liveRegionBefore).not.toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      // The new status text is announced by the same live region — not a
      // freshly mounted one, which some screen readers announce on mount
      // regardless of content, defeating the point of a targeted update.
      const liveRegionAfter = within(sidebar)
        .getByText('Complete')
        .closest('[aria-live="polite"]');
      expect(liveRegionAfter).toBe(liveRegionBefore);
    });

    it('stops polling once the tenant reaches a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: idleProvisioningSteps(),
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
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('does not poll at all when the tenant is already at a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
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
        // `provisioningStatus` only ever settles on the *last* step, so a
        // step 1 failure genuinely leaves it non-terminal — this is the bug
        // this test guards against regressing.
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
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
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      // No further calls — the action is not called again once the failure
      // with nothing running has been observed.
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('keeps polling, unchanged, while a step is RUNNING', async () => {
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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(3);
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      // Confirm it's genuinely stopped on mount — a step already failed with
      // nothing running must never schedule a poll in the first place.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();

      // A real GitHub Actions dispatch only acknowledges GitHub's receipt of
      // the request — it does not wait for a runner to actually pick up the
      // job, which routinely takes longer than one poll interval. Model
      // that: the very next tick after Retry still reports the exact same
      // failed-and-nothing-running snapshot as before the click.
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

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
      });

      // First tick after Retry: still the stale, unchanged snapshot.
      // Polling must NOT stop on this — it hasn't yet observed the retry
      // taking effect.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      // Second tick: the retried workflow has now actually started —
      // polling picks up the change.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(2);
      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Start provisioning' }),
        );
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

    it('clears the retry baseline as soon as a real transition arrives, without waiting for the cap', async () => {
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
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      // A handful of stale ticks first — still well short of the cap — then
      // the workflow genuinely starts.
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
      });

      for (let tick = 0; tick < 3; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(3);

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      // Polling keeps going normally past the transition — it wasn't
      // waiting on the cap to notice the change.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(6);
    });

    it('stops polling once the component unmounts', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { unmount } = render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('surfaces a stalled-poll indicator, keeps the last-known state visible, and keeps retrying when a poll tick rejects', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
        new Error('NEXT_REDIRECT'),
      );
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      // Last-known state stays visible — a rejected tick never clears it.
      expect(within(sidebar).getByText('Running…')).toBeVisible();
      expect(
        screen.getByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).toBeVisible();

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });

      // The interval never stopped — the very next tick succeeds on its own,
      // which dismisses the warning toast (its own exit animation is what
      // the extra advance below flushes).
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
      expect(within(sidebar).getByText('Complete')).toBeVisible();
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
      const tenant = makeTenant({
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
      const tenant = makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      const { container } = render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      const liveRegions = container.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
      for (const region of liveRegions) {
        expect(region).not.toHaveTextContent('6m ago');
      }
    });

    it("shows a failed step's updatedAt as relative time, keeping the full ISO in dateTime", () => {
      vi.setSystemTime(new Date('2026-08-12T14:25:00.000Z'));
      const tenant = makeTenant({
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
      const tenant = makeTenant({
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
      const tenant = makeTenant({
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

      expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
    });

    it('renders no Run card for a tenant with no run', () => {
      const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          ownerEmail="owner@example.com"
        />,
      );

      expect(
        screen.queryByRole('heading', { level: 2, name: 'Run' }),
      ).not.toBeInTheDocument();
    });

    it('renders a Run card with Started/Finished/Registry when the run exists, each showing relative and absolute UTC time together', () => {
      vi.setSystemTime(new Date('2026-08-12T14:24:00.000Z'));
      const tenant = makeTenant({
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

      expect(
        screen.getByRole('heading', { level: 2, name: 'Run' }),
      ).toBeVisible();
      expect(
        screen.getByText('6m ago · Aug 12, 2026, 2:18 PM UTC'),
      ).toBeVisible();
      expect(
        screen.getByText('2m ago · Aug 12, 2026, 2:22 PM UTC'),
      ).toBeVisible();
      expect(screen.getByText('production')).toBeVisible();
    });
  });
});
