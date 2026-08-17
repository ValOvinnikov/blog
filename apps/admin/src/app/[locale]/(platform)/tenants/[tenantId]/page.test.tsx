import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import TenantStatusPage from './page';

const { listTenantsByIdsMock, getDomainVerificationStatusMock } = vi.hoisted(
  () => ({
    listTenantsByIdsMock: vi.fn(),
    getDomainVerificationStatusMock: vi.fn(),
  }),
);

vi.mock('@blog/db', () => ({
  queries: { tenants: { listTenantsByIds: listTenantsByIdsMock } },
}));

vi.mock('@admin/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock('@admin/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

const setup = customRenderAsync(TenantStatusPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantStatusPage, () => {
  beforeEach(() => {
    listTenantsByIdsMock.mockReset();
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue('NOT_CONFIGURED');
  });

  it('renders the provisioning status view and the deprovisioning control for the resolved tenant', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    ).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
