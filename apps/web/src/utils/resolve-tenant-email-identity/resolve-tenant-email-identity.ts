import type { TTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';
import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import { toTenantEmailBrand } from '@web/utils/to-tenant-email-brand';

type TTenantEmailIdentity = {
  brand: TTenantEmailBrand;
  brandName: string;
};

// Only reached when an already-active tenant's own row can't be read at
// send time — a genuine anomaly, not the expected path.
const DEFAULT_BRAND_NAME = 'Newsletter';

/**
 * Resolves the sending tenant's own brand and display name for a
 * tenant-facing email. Falls back to the product default palette and a
 * generic name on a failed lookup rather than blocking the send — a
 * confirmation email that arrives unbranded is better than one that never
 * arrives.
 */
export const resolveTenantEmailIdentity = async (
  tenantId: string,
): Promise<TTenantEmailIdentity> => {
  const [siteConfigResult, tenant] = await Promise.all([
    getSiteConfig(),
    queries.tenants.getTenantById(tenantId),
  ]);

  if (!siteConfigResult.ok) {
    logger.warn('tenant_email_identity.site_config_fetch_failed', {
      tenantId,
      error: siteConfigResult.error,
    });
  }

  if (!tenant) {
    logger.warn('tenant_email_identity.tenant_row_not_found', { tenantId });
  }

  return {
    brand: toTenantEmailBrand(
      siteConfigResult.ok ? siteConfigResult.data : undefined,
    ),
    brandName: tenant?.name ?? DEFAULT_BRAND_NAME,
  };
};
