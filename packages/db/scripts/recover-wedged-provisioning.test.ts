import type { TTenant } from '@blog/db/schema/tenants';

import { recoverWedgedTenants } from './recover-wedged-provisioning';

const { listTenantsWedgedInProvisioningMock, setTenantProvisioningStatusMock } =
  vi.hoisted(() => ({
    listTenantsWedgedInProvisioningMock: vi.fn(),
    setTenantProvisioningStatusMock: vi.fn(),
  }));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsWedgedInProvisioning: listTenantsWedgedInProvisioningMock,
  setTenantProvisioningStatus: setTenantProvisioningStatusMock,
}));

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe(recoverWedgedTenants, () => {
  it('settles every wedged tenant to FAILED when not a dry run', async () => {
    listTenantsWedgedInProvisioningMock.mockResolvedValue([
      tenant({ id: 'tenant-1' }),
      tenant({ id: 'tenant-2' }),
    ]);

    const count = await recoverWedgedTenants(false);

    expect(count).toBe(2);
    expect(setTenantProvisioningStatusMock).toHaveBeenCalledTimes(2);
    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-1',
      'FAILED',
    );
    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-2',
      'FAILED',
    );
  });

  it('reports wedged tenants without writing anything on a dry run', async () => {
    listTenantsWedgedInProvisioningMock.mockResolvedValue([
      tenant({ id: 'tenant-1' }),
    ]);

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
