import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { TenantDangerPageContent } from './tenant-danger-page-content';

const render = renderWithIntl;

const { useDeprovisioningPollMock } = vi.hoisted(() => ({
  useDeprovisioningPollMock: vi.fn(),
}));

vi.mock(
  '@platform/components/features/tenants/deprovisioning-status-view',
  () => ({
    useDeprovisioningPoll: useDeprovisioningPollMock,
    DeprovisioningStatusView: () => (
      <div data-testid="deprovisioning-status-view" />
    ),
  }),
);

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: vi.fn(),
}));

const runStarted = { startedAt: '2026-08-12T14:18:00.000Z' };

describe(TenantDangerPageContent, () => {
  beforeEach(() => {
    useDeprovisioningPollMock.mockReset();
  });

  it('marks the deprovision trigger aria-disabled while a dispatched run is genuinely in progress', () => {
    useDeprovisioningPollMock.mockReturnValue({ isRunning: true });
    const tenant = makeTenant({
      deprovisionedAt: null,
      deprovisioningSteps: { ...idleDeprovisioningSteps(), run: runStarted },
    });

    render(<TenantDangerPageContent tenant={tenant} />);

    const trigger = screen.getByRole('button', { name: 'Deprovision' });
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(trigger).not.toBeDisabled();
  });

  it('keeps the deprovision trigger enabled once a run has failed', () => {
    useDeprovisioningPollMock.mockReturnValue({ isRunning: false });
    const tenant = makeTenant({
      deprovisionedAt: null,
      deprovisioningSteps: { ...idleDeprovisioningSteps(), run: runStarted },
    });

    render(<TenantDangerPageContent tenant={tenant} />);

    const trigger = screen.getByRole('button', { name: 'Deprovision' });
    expect(trigger).toBeEnabled();
    expect(trigger).not.toHaveAttribute('aria-disabled');
  });

  it('keeps the deprovision trigger enabled for a tenant that has never been deprovisioned', () => {
    useDeprovisioningPollMock.mockReturnValue({ isRunning: true });
    const tenant = makeTenant({ deprovisionedAt: null });

    render(<TenantDangerPageContent tenant={tenant} />);

    const trigger = screen.getByRole('button', { name: 'Deprovision' });
    expect(trigger).toBeEnabled();
    expect(trigger).not.toHaveAttribute('aria-disabled');
    expect(
      screen.queryByTestId('deprovisioning-status-view'),
    ).not.toBeInTheDocument();
  });
});
