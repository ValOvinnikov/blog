import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toMarketingHost } from '@platform/utils/marketing-host/marketing-host';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';

const findPlatformTenant = async (
  rootDomain: string,
  marketingHost: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TTenant>> => {
  const marketingTenant = marketingHost
    ? await queries.tenantDomains.getTenantByDomain(marketingHost)
    : undefined;

  return marketingTenant ?? queries.tenantDomains.getTenantByDomain(rootDomain);
};

export const revalidatePlatformSite = async (): Promise<void> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) {
    logger.error(BILLING_LOG.CATALOGUE_REVALIDATE_SKIPPED);
    return;
  }
  const marketingHost = toMarketingHost(env.MARKETING_SITE_URL);

  try {
    const tenant = await findPlatformTenant(rootDomain, marketingHost);
    if (!tenant) {
      logger.error(BILLING_LOG.CATALOGUE_PLATFORM_TENANT_MISSING, {
        rootDomain,
        marketingHost,
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
