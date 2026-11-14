import 'server-only';

import { queries } from '@blog/db';
import { BILLING_LOG } from '@platform/constants/billing';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export const revalidatePlatformSite = async (): Promise<void> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) {
    logger.error(BILLING_LOG.CATALOGUE_REVALIDATE_SKIPPED);
    return;
  }

  try {
    const tenant = await queries.tenantDomains.getTenantByDomain(rootDomain);
    if (!tenant) {
      logger.error(BILLING_LOG.CATALOGUE_PLATFORM_TENANT_MISSING, {
        rootDomain,
      });
      return;
    }
    await revalidateSiteConfig(tenant.id);
  } catch (error) {
    logger.error(
      BILLING_LOG.CATALOGUE_REVALIDATE_FAILED,
      toLoggableError(error),
    );
  }
};
