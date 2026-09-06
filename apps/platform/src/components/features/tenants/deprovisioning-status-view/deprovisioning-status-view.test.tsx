import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { DeprovisioningStatusView } from './deprovisioning-status-view';

const render = renderWithIntl;

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

describe(DeprovisioningStatusView, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a starting notice, not "Not started", when a teardown was requested but no run marker has appeared yet', () => {
    const tenant = makeTenant({ deprovisioningSteps: null });
    render(<DeprovisioningStatusView tenant={tenant} />);

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(
      screen.getByText(
        'A teardown has been requested for this tenant — this card will update automatically once the workflow reports in.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });

  it('titles the card "Deprovisioning progress" and renders every step in order', () => {
    const tenant = makeTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(<DeprovisioningStatusView tenant={tenant} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Deprovisioning progress',
      }),
    ).toBeVisible();
    expect(screen.getByText('Remove domain')).toBeVisible();
    expect(screen.getByText('Archive Sanity project')).toBeVisible();
    expect(screen.getByText('Revoke Sanity tokens')).toBeVisible();
    expect(screen.getByText('Clear provisioning artifacts')).toBeVisible();
    expect(screen.getByText('Archive tenant')).toBeVisible();
    expect(screen.getByText('Invalidate cached pages')).toBeVisible();
  });

  it('shows the Running badge while a step is in progress, with no error card', () => {
    const tenant = makeTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(<DeprovisioningStatusView tenant={tenant} />);

    expect(screen.getAllByText('Running…').length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the Complete badge once every step is done', () => {
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
    render(<DeprovisioningStatusView tenant={tenant} />);

    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the run card once a run exists', () => {
    const tenant = makeTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(<DeprovisioningStatusView tenant={tenant} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
  });

  describe('a failed step', () => {
    const renderFailed = (error: string) => {
      const tenant = makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error,
          },
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:19:00.000Z',
          },
        },
      });
      render(<DeprovisioningStatusView tenant={tenant} />);
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
        screen.getByText('Failed while running "Revoke Sanity tokens".'),
      ).toBeVisible();
      expect(screen.getByText('Technical details')).toBeVisible();
      expect(screen.getByText(rawError)).toBeInTheDocument();
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
});
