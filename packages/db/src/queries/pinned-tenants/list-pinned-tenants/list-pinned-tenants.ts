import { getDb } from '@shinefold/db/client';
import { buildTenantListCriteria } from '@shinefold/db/queries/tenants/tenant-list-criteria';
import {
  tenantsPageRowColumns,
  toTenantsPageRow,
  type TTenantsPageRow,
} from '@shinefold/db/queries/tenants/tenants-page-row';
import { pinnedTenants } from '@shinefold/db/schema/pinned-tenants';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

export async function listPinnedTenants(
  adminId: string,
): Promise<TTenantsPageRow[]> {
  const { where, orderBy } = buildTenantListCriteria({});

  const rows = await getDb()
    .select(tenantsPageRowColumns)
    .from(pinnedTenants)
    .innerJoin(tenants, eq(pinnedTenants.tenantId, tenants.id))
    .where(and(eq(pinnedTenants.adminId, adminId), where))
    .orderBy(...orderBy);

  return rows.map(toTenantsPageRow);
}
