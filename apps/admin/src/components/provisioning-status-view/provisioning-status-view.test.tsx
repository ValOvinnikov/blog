import {
  act,
  renderWithIntl,
  screen,
  waitFor,
} from '@admin/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@admin/testing/tenants/fixtures';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/config';
import userEvent from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const render = renderWithIntl;

const POLL_INTERVAL_MS = 4000;

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@admin/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

describe(ProvisioningStatusView, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue(undefined);
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
  });

  it('splits the heading into an eyebrow and the tenant name', () => {
    const tenant = makeTenant({ name: 'Acme Inc.' });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getByText('Provisioning status')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
  });

  it('lists all five provisioning steps in order', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    const headings = [
      'Create Sanity project',
      'Seed content',
      'Deploy Studio',
      'Persist read token',
      'Map domain',
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
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getAllByText('Running…')[0]).toBeVisible();
  });

  it('shows the error message and a Retry button for a failed step, with no Retry for others', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel deploy failed: build error',
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getByText('Vercel deploy failed: build error')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
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
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('shows the live DNS verification status', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
      />,
    );

    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByText('Verified')).toBeVisible();
  });

  it('keeps the NOT_CONFIGURED badge short and explains it in adjacent text, without naming env vars', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getByText('Unavailable')).toBeVisible();

    const hint = screen.getByText(
      "The Vercel integration isn't configured on this deployment, so domain verification can't run — this isn't specific to this tenant.",
    );
    expect(hint).toBeVisible();
    expect(hint.textContent).not.toMatch(
      /VERCEL_API_TOKEN|VERCEL_WEB_PROJECT_ID/,
    );
  });

  it('shows a Start provisioning action when every step is idle', () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
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
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Start provisioning' }),
    ).not.toBeInTheDocument();
  });

  it('re-dispatches the workflow for this tenant when Start provisioning is clicked', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('shows a spinner alongside a running step, and no spinner for other statuses', () => {
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
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('exposes the running spinner as the sole accessible status announcement, hiding the duplicate badge text', () => {
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
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    // Found without `hidden: true` — genuinely present in the accessibility
    // tree, not merely rendered with an ancestor `aria-hidden` masking it.
    expect(
      screen.getByRole('status', { name: 'Running…' }),
    ).toBeInTheDocument();
    // The adjacent StatusBadge repeats the same text visually; it must be
    // hidden from the accessibility tree so it isn't announced a second time.
    expect(screen.getByText('Running…')).toHaveAttribute('aria-hidden', 'true');
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
          domainVerificationStatus="NOT_CONFIGURED"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(screen.getByText('Done')).toBeVisible();
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
          domainVerificationStatus="NOT_CONFIGURED"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
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
          domainVerificationStatus="NOT_CONFIGURED"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
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
          domainVerificationStatus="NOT_CONFIGURED"
        />,
      );

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });
  });
});
