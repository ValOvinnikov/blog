import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { TenantStatusView } from './tenant-status-view';

const render = renderWithIntl;

// Both Server Action modules these child components import transitively
// pull in `requireAdmin` → Auth.js — mocked here purely to keep this render
// test from loading that chain, same as `provisioning-status-view.test.tsx`
// and `deprovision-tenant-control.test.tsx` do for their own renders.
vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock('@admin/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

describe(TenantStatusView, () => {
  it('renders both provisioning progress and the deprovisioning control', () => {
    const tenant = makeTenant();
    render(
      <TenantStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(
      screen.getByRole('heading', { name: /Provisioning Acme Inc\./ }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    ).toBeVisible();
  });

  it('shows the archived state instead of the trigger for a deprovisioned tenant', () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(
      <TenantStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getByText('Deprovisioned')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Deprovision tenant' }),
    ).not.toBeInTheDocument();
  });
});
