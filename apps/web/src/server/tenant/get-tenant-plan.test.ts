import { getTenantPlan } from './get-tenant-plan';

const { getRequestTenantIdMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  getRequestTenantIdMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
    },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT_A_ID = 'tenant-a';
const TENANT_B_ID = 'tenant-b';

describe(getTenantPlan, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    listTenantsByIdsMock.mockReset();
  });

  it('resolves the plan of the request-resolved tenant id', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    listTenantsByIdsMock.mockResolvedValue([
      { id: TENANT_A_ID, plan: 'GROWTH' },
    ]);

    const result = await getTenantPlan();

    expect(result).toEqual({ ok: true, data: 'GROWTH' });
    expect(listTenantsByIdsMock).toHaveBeenCalledWith([TENANT_A_ID]);
  });

  it('returns ok:true with undefined data when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getTenantPlan();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('returns ok:false when a query rejects', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    listTenantsByIdsMock.mockRejectedValue(new Error('boom'));

    const result = await getTenantPlan();

    expect(result.ok).toBe(false);
  });

  it("resolves each request's own tenant's plan rather than a shared one", async () => {
    listTenantsByIdsMock.mockImplementation((ids: string[]) => {
      const [id] = ids;
      return [{ id, plan: id === TENANT_A_ID ? 'GROWTH' : 'STARTER' }];
    });

    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    const resultA = await getTenantPlan();

    getRequestTenantIdMock.mockResolvedValue(TENANT_B_ID);
    const resultB = await getTenantPlan();

    expect(resultA).toEqual({ ok: true, data: 'GROWTH' });
    expect(resultB).toEqual({ ok: true, data: 'STARTER' });
  });
});
