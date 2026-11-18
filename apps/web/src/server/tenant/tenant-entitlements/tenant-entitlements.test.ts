import { faker } from '@faker-js/faker';
import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { TENANT_ENTITLEMENTS_LOG } from '@web/constants/tenant-entitlements';
import { ONE_HOUR_IN_SECONDS } from '@web/constants/time';
import {
  clearNextCache,
  revalidateTag,
} from '@web/testing/server/next-cache/json-round-trip-next-cache';
import { mockEntitlementGrant } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { buildSiteConfigCacheTag } from '@web/utils/tenant-cache-tags';

import {
  getCachedTenantEntitlements,
  resolveProxyTenantPlanEntitlements,
  resolveTenantPlanEntitlements,
} from './tenant-entitlements';

faker.seed(6781);

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn() },
    tenantEntitlementGrants: { listResolvableEntitlementGrants: vi.fn() },
  },
}));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/json-round-trip-next-cache'),
);

const MOCK_FILLED_AT = faker.date.past();
const MOCK_GRANT_EXPIRES_AT = faker.date.soon({ refDate: MOCK_FILLED_AT });
const MOCK_AFTER_EXPIRY = faker.date.soon({ refDate: MOCK_GRANT_EXPIRES_AT });
const MOCK_AN_HOUR_LATER = new Date(
  MOCK_FILLED_AT.getTime() + ONE_HOUR_IN_SECONDS * 1000,
);

const FAILED_GRANTS_READ_CASE =
  'resolves the plan alone and logs when the grants cannot be read';

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const listResolvableEntitlementGrantsMock = vi.mocked(
  queries.tenantEntitlementGrants.listResolvableEntitlementGrants,
);

describe(getCachedTenantEntitlements, () => {
  beforeEach(() => {
    clearNextCache();
    vi.useFakeTimers({ toFake: ['Date'], now: MOCK_FILLED_AT });
    getTenantByIdMock.mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE }));
    listResolvableEntitlementGrantsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the plan's entitlements for a tenant with no grants", async () => {
    const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(entitlements?.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
  });

  it('adds a granted capability', async () => {
    listResolvableEntitlementGrantsMock.mockResolvedValue([
      mockEntitlementGrant(),
    ]);

    const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(entitlements?.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it('reads the tenant and its grants by id', async () => {
    await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(listResolvableEntitlementGrantsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it('resolves nothing for an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(
      getCachedTenantEntitlements(MOCK_TENANT_ID),
    ).resolves.toBeUndefined();
  });

  describe('with a grant that expires after the cache fills', () => {
    beforeEach(async () => {
      listResolvableEntitlementGrantsMock.mockResolvedValue([
        mockEntitlementGrant({ expiresAt: MOCK_GRANT_EXPIRES_AT }),
      ]);
      await getCachedTenantEntitlements(MOCK_TENANT_ID);
    });

    it('applies it before the expiry', async () => {
      const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

      expect(entitlements?.capabilities).toContain(CAPABILITY.CONTACT_FORM);
    });

    it('stops applying it after the expiry from the same cache entry', async () => {
      vi.setSystemTime(MOCK_AFTER_EXPIRY);

      const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

      expect(entitlements?.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
      expect(listResolvableEntitlementGrantsMock).toHaveBeenCalledOnce();
    });
  });
});

describe(resolveTenantPlanEntitlements, () => {
  beforeEach(() => {
    clearNextCache();
    getTenantByIdMock.mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE }));
    listResolvableEntitlementGrantsMock.mockResolvedValue([]);
  });

  it('resolves the supplied plan over the cached one', async () => {
    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it('adds the cached grants to the supplied plan', async () => {
    listResolvableEntitlementGrantsMock.mockResolvedValue([
      mockEntitlementGrant(),
    ]);

    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it(FAILED_GRANTS_READ_CASE, async () => {
    listResolvableEntitlementGrantsMock.mockRejectedValue(MOCK_ERROR);

    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_ENTITLEMENTS_LOG.GRANTS_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });

  it('resolves the plan alone for an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
    );

    expect(entitlements.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
  });
});

describe(resolveProxyTenantPlanEntitlements, () => {
  const resolveFreeForProxy = () =>
    resolveProxyTenantPlanEntitlements(MOCK_TENANT_ID, TENANT_PLAN.FREE);

  beforeEach(async () => {
    clearNextCache();
    vi.useFakeTimers({ toFake: ['Date'], now: MOCK_FILLED_AT });
    getTenantByIdMock.mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE }));
    listResolvableEntitlementGrantsMock.mockResolvedValue([]);
    await resolveFreeForProxy();
    listResolvableEntitlementGrantsMock.mockResolvedValue([
      mockEntitlementGrant(),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps serving its cached grants within the hour', async () => {
    const entitlements = await resolveFreeForProxy();

    expect(entitlements.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
  });

  it('reads the grants again once the hour lapses', async () => {
    vi.setSystemTime(MOCK_AN_HOUR_LATER);

    const entitlements = await resolveFreeForProxy();

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it("reads the grants again once the tenant's site-config tag expires", async () => {
    revalidateTag(buildSiteConfigCacheTag(MOCK_TENANT_ID));

    const entitlements = await resolveFreeForProxy();

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it("reads only the tenant's grants, never its row", () => {
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it(FAILED_GRANTS_READ_CASE, async () => {
    clearNextCache();
    listResolvableEntitlementGrantsMock.mockRejectedValue(MOCK_ERROR);

    const entitlements = await resolveFreeForProxy();

    expect(entitlements.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_ENTITLEMENTS_LOG.GRANTS_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
