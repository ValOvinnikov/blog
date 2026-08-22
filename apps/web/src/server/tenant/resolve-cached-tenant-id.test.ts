import { resolveCachedTenantId } from './resolve-cached-tenant-id';

const { listTenantsMock } = vi.hoisted(() => ({ listTenantsMock: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: { tenants: { listTenants: listTenantsMock } },
}));

describe(resolveCachedTenantId, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
  });

  it('resolves the first tenant row id', async () => {
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }, { id: 'tenant-2' }]);

    await expect(resolveCachedTenantId()).resolves.toBe('tenant-1');
  });

  it('resolves undefined when there are no tenant rows', async () => {
    listTenantsMock.mockResolvedValue([]);

    await expect(resolveCachedTenantId()).resolves.toBeUndefined();
  });
});
