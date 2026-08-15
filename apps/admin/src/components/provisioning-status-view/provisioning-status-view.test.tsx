import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@admin/testing/tenants/fixtures';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/config';
import userEvent from '@testing-library/user-event';

import { ProvisioningStatusView } from './provisioning-status-view';

const render = renderWithIntl;

const { retryProvisioningStepActionMock } = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

describe(ProvisioningStatusView, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue(undefined);
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
});
