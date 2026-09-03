import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { resolveTenant } from './resolve-tenant';

const { getTenantByDomainMock, listTenantsMock, isProductionEnvironmentMock } =
  vi.hoisted(() => ({
    getTenantByDomainMock: vi.fn(),
    listTenantsMock: vi.fn(),
    isProductionEnvironmentMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    tenants: { listTenants: listTenantsMock },
  },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const buildServableTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    primaryDomain: 'acme.example.com',
    status: TENANT_STATUS.ACTIVE,
    sanityProjectId: 'proj',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted-token',
    ...overrides,
  } as TTenant;
};

describe(resolveTenant, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    listTenantsMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('resolves the full tenant row owning the host, without checking the sole-tenant fallback', async () => {
    const tenant = buildServableTenant();
    getTenantByDomainMock.mockResolvedValue(tenant);

    await expect(resolveTenant('acme.example.com')).resolves.toEqual(tenant);
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('falls back to the sole tenant row outside production when the host has no match', async () => {
    const tenant = buildServableTenant();
    getTenantByDomainMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([tenant]);

    await expect(resolveTenant('unknown.example.com')).resolves.toEqual(tenant);
  });

  it('falls back to the sole tenant row outside production when there is no host at all', async () => {
    const tenant = buildServableTenant();
    listTenantsMock.mockResolvedValue([tenant]);

    await expect(resolveTenant(null)).resolves.toEqual(tenant);
    expect(getTenantByDomainMock).not.toHaveBeenCalled();
  });

  it('resolves undefined outside production when zero or multiple tenants exist', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([]);
    await expect(resolveTenant('unknown.example.com')).resolves.toBeUndefined();

    listTenantsMock.mockResolvedValue([
      buildServableTenant({ id: 'tenant-1' }),
      buildServableTenant({ id: 'tenant-2' }),
    ]);
    await expect(resolveTenant('unknown.example.com')).resolves.toBeUndefined();
  });

  it('never falls back to the sole tenant in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantByDomainMock.mockResolvedValue(undefined);

    await expect(resolveTenant('unknown.example.com')).resolves.toBeUndefined();
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('resolves the matched tenant in production without touching the fallback', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const tenant = buildServableTenant();
    getTenantByDomainMock.mockResolvedValue(tenant);

    await expect(resolveTenant('acme.example.com')).resolves.toEqual(tenant);
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('refuses an archived matched tenant instead of resolving it', async () => {
    getTenantByDomainMock.mockResolvedValue(
      buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );

    await expect(
      resolveTenant('archived.example.com'),
    ).resolves.toBeUndefined();
  });

  it('never falls back to the sole tenant when the matched host is archived, even outside production', async () => {
    getTenantByDomainMock.mockResolvedValue(
      buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );
    listTenantsMock.mockResolvedValue([buildServableTenant()]);

    await expect(
      resolveTenant('archived.example.com'),
    ).resolves.toBeUndefined();
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('refuses an archived matched tenant in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantByDomainMock.mockResolvedValue(
      buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );

    await expect(
      resolveTenant('archived.example.com'),
    ).resolves.toBeUndefined();
  });

  it('refuses a matched tenant with no Sanity project/dataset/token set yet', async () => {
    getTenantByDomainMock.mockResolvedValue(
      buildServableTenant({
        sanityProjectId: null,
        sanityDataset: null,
        sanityReadTokenEncrypted: null,
      }),
    );

    await expect(resolveTenant('draft.example.com')).resolves.toBeUndefined();
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('resolves a matched SUSPENDED tenant — reads stay allowed while suspended', async () => {
    const tenant = buildServableTenant({ status: TENANT_STATUS.SUSPENDED });
    getTenantByDomainMock.mockResolvedValue(tenant);

    await expect(resolveTenant('suspended.example.com')).resolves.toEqual(
      tenant,
    );
  });
});
