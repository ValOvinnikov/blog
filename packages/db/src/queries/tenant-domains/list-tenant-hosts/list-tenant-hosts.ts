import { listTenantDomains } from '@shinefold/db/queries/tenant-domains/list-tenant-domains';
import type { TTenant } from '@shinefold/db/schema/tenants';

export async function listTenantHosts(
  tenant: Pick<TTenant, 'id' | 'primaryDomain'>,
): Promise<string[]> {
  const rows = await listTenantDomains(tenant.id);

  return [
    ...new Set([tenant.primaryDomain, ...rows.map(({ domain }) => domain)]),
  ];
}
