import { faker } from '@faker-js/faker';
import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { clearNextCache } from '@web/testing/server/next-cache/json-round-trip-next-cache';
import { mockEntitlementGrant } from '@web/testing/server/settings-features/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

import {
  getCachedTenantEntitlements,
  resolveTenantPlanEntitlements,
} from './tenant-entitlements';

faker.seed(6781);

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn() },
    tenantEntitlementGrants: { listEntitlementGrants: vi.fn() },
  },
}));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/json-round-trip-next-cache'),
);

const MOCK_FILLED_AT = faker.date.past();
const MOCK_GRANT_EXPIRES_AT = faker.date.soon({ refDate: MOCK_FILLED_AT });
const MOCK_AFTER_EXPIRY = faker.date.soon({ refDate: MOCK_GRANT_EXPIRES_AT });

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const listEntitlementGrantsMock = vi.mocked(
  queries.tenantEntitlementGrants.listEntitlementGrants,
);

describe(getCachedTenantEntitlements, () => {
  beforeEach(() => {
    clearNextCache();
    vi.useFakeTimers({ toFake: ['Date'], now: MOCK_FILLED_AT });
    getTenantByIdMock.mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE }));
    listEntitlementGrantsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the plan's entitlements for a tenant with no grants", async () => {
    const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(entitlements?.capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
  });

  it('adds a granted capability', async () => {
    listEntitlementGrantsMock.mockResolvedValue([mockEntitlementGrant()]);

    const entitlements = await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(entitlements?.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it('reads the tenant and its grants by id', async () => {
    await getCachedTenantEntitlements(MOCK_TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(listEntitlementGrantsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('resolves nothing for an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(
      getCachedTenantEntitlements(MOCK_TENANT_ID),
    ).resolves.toBeUndefined();
  });

  describe('with a grant that expires after the cache fills', () => {
    beforeEach(async () => {
      listEntitlementGrantsMock.mockResolvedValue([
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
      expect(listEntitlementGrantsMock).toHaveBeenCalledOnce();
    });
  });
});

describe(resolveTenantPlanEntitlements, () => {
  beforeEach(() => {
    clearNextCache();
    getTenantByIdMock.mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE }));
    listEntitlementGrantsMock.mockResolvedValue([]);
  });

  it('resolves the supplied plan over the cached one', async () => {
    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
  });

  it('adds the cached grants to the supplied plan', async () => {
    listEntitlementGrantsMock.mockResolvedValue([mockEntitlementGrant()]);

    const entitlements = await resolveTenantPlanEntitlements(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
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
