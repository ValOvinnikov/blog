import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isPlatformTenant } from '@blog/db/utils/is-platform-tenant/is-platform-tenant';
import { env } from '@platform/utils/env/env';

export const resolveIsPlatformTenant = async (
  tenant: Pick<TTenant, 'id' | 'primaryDomain'>,
): Promise<boolean> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) return false;

  const hosts = await queries.tenantDomains.listTenantHosts(tenant);
  return isPlatformTenant(hosts, rootDomain);
};
