import { env } from '@platform/utils/env/env';
import { toMarketingHost } from '@platform/utils/marketing-host/marketing-host';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isPlatformTenant } from '@shinefold/db/utils/is-platform-tenant/is-platform-tenant';

export const resolveIsPlatformTenant = async (
  tenant: Pick<TTenant, 'id' | 'primaryDomain'>,
): Promise<boolean> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) return false;

  const hosts = await queries.tenantDomains.listTenantHosts(tenant);
  return isPlatformTenant(
    hosts,
    rootDomain,
    toMarketingHost(env.MARKETING_SITE_URL),
  );
};
