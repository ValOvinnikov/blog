import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { DeprovisioningStatusView } from './deprovisioning-status-view';
import { useDeprovisioningPoll } from './use-deprovisioning-poll';

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
}: {
  tenant: TTenant;
  deprovisionRequestedAt?: string;
}) => {
  const poll = useDeprovisioningPoll(tenant, deprovisionRequestedAt);
  return <DeprovisioningStatusView poll={poll} />;
};

describe(DeprovisioningStatusView, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the full step list under the Starting badge, not "Not started", when a teardown was requested but no run marker has appeared yet', () => {
    const tenant = makeTenant({ deprovisioningSteps: null });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.getByText('Remove domain')).toBeVisible();
    expect(screen.getByText('Archive Sanity project')).toBeVisible();
    expect(screen.getByText('Revoke Sanity tokens')).toBeVisible();
    expect(screen.getByText('Clear provisioning artifacts')).toBeVisible();
    expect(screen.getByText('Archive tenant')).toBeVisible();
    expect(screen.getByText('Invalidate cached pages')).toBeVisible();
    expect(screen.getAllByText('Queued').length).toBe(6);
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });

  it('shows the Starting badge and full step list, not the old failure, for a retry dispatched after a FAILED run', () => {
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
    render(
      <Wrapper
        tenant={tenant}
        deprovisionRequestedAt="2026-08-12T14:25:00.000Z"
      />,
    );

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.getAllByText('Queued').length).toBe(6);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('titles the card "Deprovisioning progress" and renders every step in order', () => {
    const tenant = makeTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(<Wrapper tenant={tenant} />);

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

  it('shows a 0 of 6 done badge in the steps card summary when nothing has completed yet', () => {
    const tenant = makeTenant({
      deprovisioningSteps: {
        ...idleDeprovisioningSteps(),
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      },
    });
    render(<Wrapper tenant={tenant} />);

    expect(screen.getByText('0 of 6 done')).toBeVisible();
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
    render(<Wrapper tenant={tenant} />);

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
    render(<Wrapper tenant={tenant} />);

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
    render(<Wrapper tenant={tenant} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
  });

  it('renders a fallback Run card header carrying the overall status badge when no run exists yet', () => {
    const tenant = makeTenant({ deprovisioningSteps: null });
    render(<Wrapper tenant={tenant} />);

    const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });
    const runHeader = runHeading.parentElement?.parentElement as HTMLElement;
    expect(runHeader).toHaveTextContent('Starting…');
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

  describe('steps disclosure collapse', () => {
    it('is expanded while the run is not done', () => {
      const tenant = makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      });
      const { container } = render(<Wrapper tenant={tenant} />);

      expect(container.querySelector('details')).toHaveAttribute('open');
    });

    it('is collapsed by default once every step is already done on mount', () => {
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
      const { container } = render(<Wrapper tenant={tenant} />);

      expect(container.querySelector('details')).not.toHaveAttribute('open');
    });

    it('auto-collapses once the run completes, and a later re-render does not undo a user-initiated reopen', async () => {
      const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
      const runningSteps = {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        run: { startedAt: '2026-08-12T14:18:00.000Z' },
      };
      const tenant = makeTenant({ deprovisioningSteps: runningSteps });
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
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
        deprovisionedAt: new Date('2026-08-12T14:20:00.000Z'),
      });
      const user = userEvent.setup();
      const { container } = render(<Wrapper tenant={tenant} />);

      const details = container.querySelector('details') as HTMLDetailsElement;
      expect(details).toHaveAttribute('open');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(details).not.toHaveAttribute('open');

      await user.click(screen.getByText('Deprovisioning progress'));
      expect(details).toHaveAttribute('open');

      // Polling has already stopped (the run is terminal), but
      // `useRelativeTimeTick` keeps forcing a periodic re-render regardless
      // — an uncontrolled `Disclosure` writing `open` from `isDefaultOpen`
      // on every render would slam this back shut here.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(details).toHaveAttribute('open');
    });
  });
});
