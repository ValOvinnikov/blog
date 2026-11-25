import { getDb } from '@shinefold/db/client';
import {
  buildTenantListCriteria,
  type TTenantListFilters,
} from '@shinefold/db/queries/tenants/tenant-list-criteria';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { getTableColumns } from 'drizzle-orm';

export type { TTenantSort } from '@shinefold/db/queries/tenants/tenant-list-criteria';

export type TListTenantsOptions = TTenantListFilters;

export type TListedTenant = TTenant & { matchedDomain?: string };

export async function listTenants(
  options: TListTenantsOptions = {},
): Promise<TListedTenant[]> {
  const { where, orderBy, matchedDomain } = buildTenantListCriteria(options);

  const rows = await getDb()
    .select({ ...getTableColumns(tenants), matchedDomain })
    .from(tenants)
    .where(where)
    .orderBy(...orderBy);

  return rows.map(({ matchedDomain, ...tenant }) => ({
    ...tenant,
    matchedDomain: matchedDomain ?? undefined,
  }));
}
