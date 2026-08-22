import { getTenantPlan } from './get-tenant-plan';

const { listTenantsMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      listTenants: listTenantsMock,
      listTenantsByIds: listTenantsByIdsMock,
    },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT = { id: 'tenant-1' };

describe(getTenantPlan, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
    listTenantsByIdsMock.mockReset();
  });

  it('resolves the plan of the cached tenant id', async () => {
    listTenantsMock.mockResolvedValue([TENANT]);
    listTenantsByIdsMock.mockResolvedValue([{ ...TENANT, plan: 'GROWTH' }]);

    const result = await getTenantPlan();

    expect(result).toEqual({ ok: true, data: 'GROWTH' });
    expect(listTenantsByIdsMock).toHaveBeenCalledWith([TENANT.id]);
  });

  it('returns ok:true with undefined data when no tenant row exists', async () => {
    listTenantsMock.mockResolvedValue([]);

    const result = await getTenantPlan();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('returns ok:false when a query rejects', async () => {
    listTenantsMock.mockRejectedValue(new Error('boom'));

    const result = await getTenantPlan();

    expect(result.ok).toBe(false);
  });
});
