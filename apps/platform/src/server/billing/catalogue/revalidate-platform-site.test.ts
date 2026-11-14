import { BILLING_LOG } from '@platform/constants/billing';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { revalidatePlatformSite } from './revalidate-platform-site';

const { getTenantByDomainMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { getTenantByDomain: getTenantByDomainMock } },
}));
vi.mock('@platform/server/site-config/revalidate-site-config');
vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

describe(revalidatePlatformSite, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    getTenantByDomainMock.mockResolvedValue({ id: MOCK_TENANT_ID });
  });

  it('revalidates the tenant that holds the root domain', async () => {
    await revalidatePlatformSite();

    expect(getTenantByDomainMock).toHaveBeenCalledWith(MOCK_TENANT_ROOT_DOMAIN);
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('logs and skips when no root domain is configured', async () => {
    envMock.TENANT_ROOT_DOMAIN = undefined;

    await revalidatePlatformSite();

    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.CATALOGUE_REVALIDATE_SKIPPED,
    );
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('logs and skips when no tenant holds the root domain', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    await revalidatePlatformSite();

    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.CATALOGUE_PLATFORM_TENANT_MISSING,
      { rootDomain: MOCK_TENANT_ROOT_DOMAIN },
    );
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('logs a failed lookup without throwing', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error());

    await expect(revalidatePlatformSite()).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.CATALOGUE_REVALIDATE_FAILED,
      expect.any(Object),
    );
  });
});
