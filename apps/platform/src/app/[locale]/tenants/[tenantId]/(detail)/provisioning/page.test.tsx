import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  INVITED_PENDING_TEXT,
  mockTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

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

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const setup = customRenderAsync(TenantProvisioningPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(TenantProvisioningPage, () => {
  let tenant: ReturnType<typeof mockTenant>;

  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    tenant = mockTenant();
    requireTenantByIdMock.mockResolvedValue({ tenant: tenant });
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
  });

  it('renders the provisioning status view for the resolved tenant, with no deprovisioning control', async () => {
    await setup();

    expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(tenant.id);
    const provisioningHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Provisioning',
    });
    const deprovisionButton = screen.queryByRole('button', {
      name: 'Deprovision',
    });

    expect(provisioningHeading).toBeVisible();
    expect(deprovisionButton).not.toBeInTheDocument();
  });

  it("shows the invited-pending owner badge when the tenant's owner has not resolved to a real user yet", async () => {
    getTenantOwnerEmailMock.mockResolvedValue(undefined);

    await setup();

    const invitedPendingText = screen.getByText(INVITED_PENDING_TEXT);

    expect(invitedPendingText).toBeVisible();
  });
});
