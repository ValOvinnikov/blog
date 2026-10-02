import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';

import { getTenantPlan } from './get-tenant-plan';

const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-request-tenant-id');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
    },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT_A_ID = 'tenant-a';
const TENANT_B_ID = 'tenant-b';

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

describe(getTenantPlan, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getTenantByIdMock.mockReset();
  });

  it('resolves the plan of the supplied tenant id', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getTenantByIdMock.mockResolvedValue({ id: TENANT_A_ID, plan: 'GROWTH' });

    const result = await getTenantPlan(TENANT_A_ID);

    expect(result).toEqual({ ok: true, data: 'GROWTH' });
    expect(getTenantByIdMock).toHaveBeenCalledWith(TENANT_A_ID, {
      includeArchived: true,
    });
  });

  it('returns ok:true with undefined data when the supplied tenant is the unresolved placeholder', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getTenantPlan(TENANT_A_ID);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('forwards an explicitly supplied tenant to getRequestTenantId', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getTenantByIdMock.mockResolvedValue({ id: TENANT_A_ID, plan: 'GROWTH' });

    await getTenantPlan(TENANT_A_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(TENANT_A_ID);
  });

  it('returns ok:false when a query rejects', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getTenantByIdMock.mockRejectedValue(new Error('boom'));

    const result = await getTenantPlan(TENANT_A_ID);

    expect(result.ok).toBe(false);
  });

  it("resolves each request's own tenant's plan", async () => {
    getTenantByIdMock.mockImplementation((id: string) => {
      return { id, plan: id === TENANT_A_ID ? 'GROWTH' : 'STARTER' };
    });

    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    const resultA = await getTenantPlan(TENANT_A_ID);

    getRequestTenantIdMock.mockResolvedValue(TENANT_B_ID);
    const resultB = await getTenantPlan(TENANT_B_ID);

    expect(resultA).toEqual({ ok: true, data: 'GROWTH' });
    expect(resultB).toEqual({ ok: true, data: 'STARTER' });
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    const dynamicSignal = Object.assign(
      new Error(
        "Dynamic server usage: Route /[tenant]/[locale] couldn't be rendered statically because it used `headers`",
      ),
      { digest: 'DYNAMIC_SERVER_USAGE' },
    );
    getRequestTenantIdMock.mockRejectedValue(dynamicSignal);

    await expect(getTenantPlan(TENANT_A_ID)).rejects.toBe(dynamicSignal);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });
});
