import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import TenantProvisioningPage from './page';

const { listTenantsByIdsMock, getTenantOwnerEmailMock } = vi.hoisted(() => ({
  listTenantsByIdsMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock(
  '@admin/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: vi.fn(),
  }),
);

vi.mock(
  '@admin/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

const setup = customRenderAsync(TenantProvisioningPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantProvisioningPage, () => {
  beforeEach(() => {
    listTenantsByIdsMock.mockReset();
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
  });

  it('renders the provisioning status view for the resolved tenant, with no deprovisioning control', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(tenant.id);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Deprovision tenant' }),
    ).not.toBeInTheDocument();
  });

  it("shows the invited-pending owner badge when the tenant's owner has not resolved to a real user yet", async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getTenantOwnerEmailMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
