import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import TenantProvisioningPage from './page';

const { requireTenantByIdMock, getTenantOwnerEmailMock } = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
}));

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: vi.fn(),
  }),
);

const setup = customRenderAsync(TenantProvisioningPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantProvisioningPage, () => {
  let tenant: ReturnType<typeof makeTenant>;

  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    tenant = makeTenant();
    requireTenantByIdMock.mockResolvedValue({ tenant: tenant });
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
  });

  it('renders the provisioning status view for the resolved tenant, with no deprovisioning control', async () => {
    await setup();

    expect(requireTenantByIdMock).toHaveBeenCalledWith('tenant-1');
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(tenant.id);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Provisioning' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Deprovision' }),
    ).not.toBeInTheDocument();
  });

  it("shows the invited-pending owner badge when the tenant's owner has not resolved to a real user yet", async () => {
    getTenantOwnerEmailMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.getByText('Invited, pending')).toBeVisible();
  });
});
