import { resolveTenantId } from './resolve-tenant-id';

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
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

describe(resolveTenantId, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    listTenantsMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('resolves the tenant owning the host, without checking the sole-tenant fallback', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'tenant-1' });

    await expect(resolveTenantId('acme.example.com')).resolves.toBe('tenant-1');
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('falls back to the sole tenant row outside production when the host has no match', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }]);

    await expect(resolveTenantId('unknown.example.com')).resolves.toBe(
      'tenant-1',
    );
  });

  it('falls back to the sole tenant row outside production when there is no host at all', async () => {
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }]);

    await expect(resolveTenantId(null)).resolves.toBe('tenant-1');
    expect(getTenantByDomainMock).not.toHaveBeenCalled();
  });

  it('resolves undefined outside production when zero or multiple tenants exist', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([]);
    await expect(
      resolveTenantId('unknown.example.com'),
    ).resolves.toBeUndefined();

    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }, { id: 'tenant-2' }]);
    await expect(
      resolveTenantId('unknown.example.com'),
    ).resolves.toBeUndefined();
  });

  it('never falls back to the sole tenant in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantByDomainMock.mockResolvedValue(undefined);

    await expect(
      resolveTenantId('unknown.example.com'),
    ).resolves.toBeUndefined();
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('resolves the matched tenant in production without touching the fallback', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantByDomainMock.mockResolvedValue({ id: 'tenant-1' });

    await expect(resolveTenantId('acme.example.com')).resolves.toBe('tenant-1');
    expect(listTenantsMock).not.toHaveBeenCalled();
  });
});
