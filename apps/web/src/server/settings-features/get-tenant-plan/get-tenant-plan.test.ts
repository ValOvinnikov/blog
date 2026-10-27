import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

import { getTenantPlan } from './get-tenant-plan';

faker.seed(6010);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);

describe(getTenantPlan, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
  });

  it('resolves the plan of the supplied tenant id', async () => {
    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result).toEqual(okResult(TENANT_PLAN.GROWTH));
    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
  });

  it('resolves no plan when the request has no resolvable tenant', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined);

    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result).toEqual(okResult());
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    await getTenantPlan(MOCK_TENANT_ID);

    expect(getRequestTenantId).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns the failure when a query rejects', async () => {
    getTenantByIdMock.mockRejectedValueOnce(MOCK_ERROR);

    const result = await getTenantPlan(MOCK_TENANT_ID);

    expect(result).toEqual(errorResult(MOCK_ERROR));
  });

  it("resolves each request's own tenant's plan", async () => {
    getTenantByIdMock.mockImplementation(async (id) =>
      mockTenant({
        id,
        plan: id === MOCK_TENANT_ID ? TENANT_PLAN.GROWTH : TENANT_PLAN.FREE,
      }),
    );
    vi.mocked(getRequestTenantId)
      .mockResolvedValueOnce(MOCK_TENANT_ID)
      .mockResolvedValueOnce(MOCK_OTHER_TENANT_ID);

    const resultA = await getTenantPlan(MOCK_TENANT_ID);
    const resultB = await getTenantPlan(MOCK_OTHER_TENANT_ID);

    expect(resultA).toEqual(okResult(TENANT_PLAN.GROWTH));
    expect(resultB).toEqual(okResult(TENANT_PLAN.FREE));
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    vi.mocked(getRequestTenantId).mockRejectedValueOnce(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );

    await expect(getTenantPlan(MOCK_TENANT_ID)).rejects.toBe(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });
});
