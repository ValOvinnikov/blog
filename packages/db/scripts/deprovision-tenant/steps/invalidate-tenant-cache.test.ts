import { TENANT_STATUS } from '@blog/db/constants';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
  MOCK_DEPROVISIONED_AT,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { faker } from '@faker-js/faker';

import { invalidateTenantCache } from './invalidate-tenant-cache';

vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');

faker.seed(5765);

const MISSING_CONFIG_ERROR =
  'invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET';

const MOCK_TENANT = mockTenant({
  status: TENANT_STATUS.ARCHIVED,
  deprovisionedAt: MOCK_DEPROVISIONED_AT,
});

describe(invalidateTenantCache, () => {
  it("requests the purge of the tenant's cached pages", async () => {
    await invalidateTenantCache(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
      webAppUrl: MOCK_DEPROVISION_ENV.webAppUrl,
      secret: MOCK_DEPROVISION_ENV.siteConfigRevalidateSecret,
      tenantId: MOCK_TENANT.id,
    });
  });

  it('requests no purge in dry-run mode', async () => {
    await invalidateTenantCache(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
  });

  it.each(['webAppUrl', 'siteConfigRevalidateSecret'] as const)(
    'throws, requesting no purge, when %s is missing',
    async (missingKey) => {
      await expect(
        invalidateTenantCache(MOCK_TENANT, {
          ...MOCK_DEPROVISION_ENV,
          [missingKey]: undefined,
        }),
      ).rejects.toThrow(MISSING_CONFIG_ERROR);

      expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
    },
  );
});
