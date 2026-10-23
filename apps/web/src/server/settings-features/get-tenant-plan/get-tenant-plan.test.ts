import { TENANT_PLAN } from '@blog/db/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { getTenantPlan } from './get-tenant-plan';

const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

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

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

describe(getTenantPlan, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    getTenantByIdMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
    });
  });

  it('resolves the plan of the supplied tenant id', async () => {
    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result).toEqual({ ok: true, data: TENANT_PLAN.GROWTH });
    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
  });

  it('resolves no plan when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    await getTenantPlan(MOCK_TENANT_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns ok:false when a query rejects', async () => {
    getTenantByIdMock.mockRejectedValue(MOCK_ERROR);

    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result.ok).toBe(false);
  });

  it("resolves each request's own tenant's plan", async () => {
    getTenantByIdMock.mockImplementation((id: string) => {
      return {
        id,
        plan: id === MOCK_TENANT_ID ? TENANT_PLAN.GROWTH : TENANT_PLAN.FREE,
      };
    });

    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    const resultA = await getTenantPlan(MOCK_TENANT_ID);

    getRequestTenantIdMock.mockResolvedValue(MOCK_OTHER_TENANT_ID);
    const resultB = await getTenantPlan(MOCK_OTHER_TENANT_ID);

    expect(resultA).toEqual({ ok: true, data: TENANT_PLAN.GROWTH });
    expect(resultB).toEqual({ ok: true, data: TENANT_PLAN.FREE });
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    getRequestTenantIdMock.mockRejectedValue(MOCK_DYNAMIC_SERVER_USAGE_ERROR);

    await expect(getTenantPlan(MOCK_TENANT_ID)).rejects.toBe(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });
});
