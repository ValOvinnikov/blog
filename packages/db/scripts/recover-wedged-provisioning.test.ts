import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { recoverWedgedTenants } from './recover-wedged-provisioning';

faker.seed(5808);

const { listTenantsWedgedInProvisioningMock, setTenantProvisioningStatusMock } =
  vi.hoisted(() => ({
    listTenantsWedgedInProvisioningMock: vi.fn(),
    setTenantProvisioningStatusMock: vi.fn(),
  }));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsWedgedInProvisioning: listTenantsWedgedInProvisioningMock,
  setTenantProvisioningStatus: setTenantProvisioningStatusMock,
}));

function mockWedgedTenant() {
  return mockTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
  });
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.warn).mockRestore();
});

describe(recoverWedgedTenants, () => {
  it('settles every wedged tenant to FAILED when not a dry run', async () => {
    const tenants = [mockWedgedTenant(), mockWedgedTenant()];
    listTenantsWedgedInProvisioningMock.mockResolvedValue(tenants);

    const count = await recoverWedgedTenants(false);

    expect(count).toBe(tenants.length);
    expect(setTenantProvisioningStatusMock.mock.calls).toEqual(
      tenants.map(({ id }) => [id, TENANT_PROVISIONING_STATUS.FAILED]),
    );
  });

  it('reports wedged tenants without writing anything on a dry run', async () => {
    listTenantsWedgedInProvisioningMock.mockResolvedValue([mockWedgedTenant()]);

    const count = await recoverWedgedTenants(true);

    expect(count).toBe(1);
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
  });

  it('returns 0 and writes nothing when no tenant is wedged', async () => {
    listTenantsWedgedInProvisioningMock.mockResolvedValue([]);

    const count = await recoverWedgedTenants(false);

    expect(count).toBe(0);
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
  });
});
