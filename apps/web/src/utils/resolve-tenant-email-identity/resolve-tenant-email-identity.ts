import type { TTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_EMAIL_IDENTITY_LOG } from '@web/constants/tenant-email-identity';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import { toTenantEmailBrand } from '@web/utils/to-tenant-email-brand';

type TTenantEmailIdentity = {
  brand: TTenantEmailBrand;
  brandName: string;
};

// Only reached when an already-active tenant's own row can't be read at send time.
const DEFAULT_BRAND_NAME = 'Newsletter';

/** A failed lookup falls back rather than blocking the send: an unbranded email beats none. */
export const resolveTenantEmailIdentity = async (
  tenantId: string,
): Promise<TTenantEmailIdentity> => {
  const [siteConfigResult, tenant] = await Promise.all([
    getSiteConfig(tenantId),
    queries.tenants.getTenantById(tenantId),
  ]);

  if (!tenant) {
    logger.warn(TENANT_EMAIL_IDENTITY_LOG.TENANT_ROW_NOT_FOUND, { tenantId });
  }

  const brandName = await getBrandName({ tenantId, tenantName: tenant?.name });

  return {
    brand: toTenantEmailBrand(
      siteConfigResult.ok ? siteConfigResult.data : undefined,
    ),
    brandName: brandName ?? DEFAULT_BRAND_NAME,
  };
};
