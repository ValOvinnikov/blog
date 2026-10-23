import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  doneDeprovisioningSteps,
  idleDeprovisioningSteps,
  makeClientTenant,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_7_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';
import { useDeprovisioningPoll } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import userEvent from '@testing-library/user-event';

import { DeprovisioningStatusView } from './deprovisioning-status-view';

const REMOVE_DOMAIN_LABEL = 'Remove domain';
const ARCHIVE_SANITY_PROJECT = 'Archive Sanity project';
const REVOKE_SANITY_TOKENS_LABEL = 'Revoke Sanity tokens';
const CLEAR_PROVISIONING_ARTIFACTS = 'Clear provisioning artifacts';
const ARCHIVE_TENANT = 'Archive tenant';
const PURGE_READER_DATA = 'Purge reader data';
const INVALIDATE_CACHED_PAGES = 'Invalidate cached pages';
const ARIA_EXPANDED = 'aria-expanded';

const render = renderWithIntl;

const STEP_POLL_INTERVAL_MS = 4000;

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

const Wrapper = ({
  tenant,
  deprovisionRequestedAt,
  headingLevel,
}: {
  tenant: TClientTenant;
  deprovisionRequestedAt?: string;
  headingLevel?: 3;
}) => {
  const poll = useDeprovisioningPoll(tenant, {
    isEnabled: true,
    deprovisionRequestedAt,
  });
  return <DeprovisioningStatusView poll={poll} headingLevel={headingLevel} />;
};

describe(`<${DeprovisioningStatusView.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says no run has started yet in the Run card before any run exists', () => {
    const tenant = makeClientTenant({ deprovisioningSteps: null });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getByText('No run has started yet.')).toBeVisible();
  });

  it('shows the full step list under the Starting badge, not "Not started", when a teardown was requested but no run marker has appeared yet', () => {
    const tenant = makeClientTenant({ deprovisioningSteps: null });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.getByText(REMOVE_DOMAIN_LABEL)).toBeVisible();
    expect(screen.getByText(ARCHIVE_SANITY_PROJECT)).toBeVisible();
    expect(screen.getByText(REVOKE_SANITY_TOKENS_LABEL)).toBeVisible();
    expect(screen.getByText(CLEAR_PROVISIONING_ARTIFACTS)).toBeVisible();
    expect(screen.getByText(ARCHIVE_TENANT)).toBeVisible();
    expect(screen.getByText(PURGE_READER_DATA)).toBeVisible();
    expect(screen.getByText(INVALIDATE_CACHED_PAGES)).toBeVisible();
    expect(screen.getAllByText('Queued').length).toBe(7);
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });

  it('shows the Starting badge and full step list, not the old failure, for a retry dispatched after a FAILED run', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Sanity Access API returned 403',
        },
        run: {
          startedAt: MOCK_RUN_STARTED_AT,
          finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
        },
      },
    });
    render(
      <Wrapper
        tenant={tenant}
        deprovisionRequestedAt={MOCK_RUN_PLUS_7_MIN_AT}
      />,
    );

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.getAllByText('Queued').length).toBe(7);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('titles the card "Deprovisioning progress" and renders every step in order', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: MOCK_RUN_STARTED_AT },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /^Deprovisioning progress/,
      }),
    ).toBeVisible();
    expect(screen.getByText(REMOVE_DOMAIN_LABEL)).toBeVisible();
    expect(screen.getByText(ARCHIVE_SANITY_PROJECT)).toBeVisible();
    expect(screen.getByText(REVOKE_SANITY_TOKENS_LABEL)).toBeVisible();
    expect(screen.getByText(CLEAR_PROVISIONING_ARTIFACTS)).toBeVisible();
    expect(screen.getByText(ARCHIVE_TENANT)).toBeVisible();
    expect(screen.getByText(PURGE_READER_DATA)).toBeVisible();
    expect(screen.getByText(INVALIDATE_CACHED_PAGES)).toBeVisible();
  });

  it('shows a 0 of 7 done badge in the steps card summary when nothing has completed yet', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: MOCK_RUN_STARTED_AT },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getByText('0 of 7 done')).toBeVisible();
  });

  it('shows the Running badge while a step is in progress, with no error card', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: MOCK_RUN_STARTED_AT },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getAllByText('Running…').length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the Complete badge once every step is done', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...doneDeprovisioningSteps(),
        run: {
          startedAt: MOCK_RUN_STARTED_AT,
          finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
        },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the run card once a run exists', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: MOCK_RUN_STARTED_AT },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
  });

  it('nests the steps and run headings at a caller-supplied level', () => {
    const tenant = makeClientTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: MOCK_RUN_STARTED_AT },
      },
    });
    render(<Wrapper tenant={tenant} headingLevel={3} />);

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /^Deprovisioning progress/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Run' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders a fallback Run card header carrying the overall status badge when no run exists yet', () => {
    const tenant = makeClientTenant({ deprovisioningSteps: null });
    render(<Wrapper tenant={tenant} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
    expect(screen.getByText('Starting…')).toBeVisible();
  });

  describe('a failed step', () => {
    const renderFailed = (error: string) => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error,
          },
          run: {
            startedAt: MOCK_RUN_STARTED_AT,
            finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
          },
        },
      });
      render(<Wrapper tenant={tenant} />);
    };

    it('shows the Failed badge, the failing step, and the raw error under Technical details', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/tokens failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to revoke tokens."}';
      renderFailed(rawError);

      expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
      expect(
        screen.getByRole('heading', {
          name: 'Missing permission to complete this step',
        }),
      ).toBeVisible();
      expect(
        screen.getByText(
          `Failed while running "${REVOKE_SANITY_TOKENS_LABEL}".`,
        ),
      ).toBeVisible();
      expect(screen.getByText('Technical details')).toBeVisible();
      expect(screen.getByText(rawError)).not.toBeVisible();
    });

    it('renders no retry button', () => {
      renderFailed('fetch failed');

      expect(
        screen.queryByRole('button', { name: /retry/i }),
      ).not.toBeInTheDocument();
    });

    it('falls back to a generic headline for an unrecognised failure shape', () => {
      renderFailed('CORS API is down');

      expect(
        screen.getByRole('heading', { name: 'This step failed' }),
      ).toBeVisible();
    });
  });

  describe('steps disclosure collapse', () => {
    const stepsToggle = () =>
      screen.getByRole('button', { name: /Deprovisioning progress/ });

    it('is expanded while the run is not done', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      });
      render(<Wrapper tenant={tenant} />);

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('is collapsed by default once every step is already done on mount', () => {
      const tenant = makeClientTenant({
        deprovisioningSteps: {
          ...doneDeprovisioningSteps(),
          run: {
            startedAt: MOCK_RUN_STARTED_AT,
            finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
          },
        },
      });
      render(<Wrapper tenant={tenant} />);

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('auto-collapses once the run completes, and a later re-render does not undo a user-initiated reopen', async () => {
      const runningSteps = {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: MOCK_RUN_STARTED_AT },
      };
      const tenant = makeClientTenant({ deprovisioningSteps: runningSteps });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: {
          ...doneDeprovisioningSteps(),
          run: {
            startedAt: MOCK_RUN_STARTED_AT,
            finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
          },
        },
        deprovisionedAt: new Date(MOCK_RUN_PLUS_2_MIN_AT),
      });
      const user = userEvent.setup();
      render(<Wrapper tenant={tenant} />);

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'false');

      await user.click(stepsToggle());
      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(stepsToggle()).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
