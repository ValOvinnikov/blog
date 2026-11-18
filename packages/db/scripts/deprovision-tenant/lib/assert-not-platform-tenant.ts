import { listTenantHosts } from '@shinefold/db/queries/tenant-domains/list-tenant-hosts';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isPlatformTenant } from '@shinefold/db/utils/is-platform-tenant/is-platform-tenant';

import type { TDeprovisionEnv } from './env';

export async function assertNotPlatformTenant(
  tenant: TTenant,
  { tenantRootDomain, marketingHost }: TDeprovisionEnv,
): Promise<void> {
  const hosts = await listTenantHosts(tenant);
  if (isPlatformTenant(hosts, tenantRootDomain, marketingHost)) {
    throw new Error(
      `deprovision-tenant: tenant "${tenant.id}" ("${tenant.name}") is the platform tenant — it holds the platform root domain "${tenantRootDomain}" or the marketing site host — and is never deprovisioned, aborting before any destructive action.`,
    );
  }
}
