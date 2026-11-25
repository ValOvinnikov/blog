import { getDb } from '@shinefold/db/client';
import {
  buildTenantListCriteria,
  type TTenantListFilters,
} from '@shinefold/db/queries/tenants/tenant-list-criteria';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { count, sql } from 'drizzle-orm';

export type TTenantsPageRequest = TTenantListFilters & {
  page: number;
  pageSize: number;
};

export type TTenantsPageRow = Pick<
  TTenant,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'plan'
  | 'status'
  | 'provisioningStatus'
  | 'deprovisionedAt'
  | 'createdAt'
> & { matchedDomain?: string };

export type TTenantsPage = {
  rows: TTenantsPageRow[];
  total: number;
};

async function countMatches(
  where: ReturnType<typeof buildTenantListCriteria>['where'],
): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(tenants)
    .where(where);

  return row?.total ?? 0;
}

export async function listTenantsPage({
  page,
  pageSize,
  ...filters
}: TTenantsPageRequest): Promise<TTenantsPage> {
  const db = getDb();
  const { where, orderBy, matchedDomain } = buildTenantListCriteria(filters);
  const offset = Math.max(page - 1, 0) * pageSize;

  const pageRows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      primaryDomain: tenants.primaryDomain,
      plan: tenants.plan,
      status: tenants.status,
      provisioningStatus: tenants.provisioningStatus,
      deprovisionedAt: tenants.deprovisionedAt,
      createdAt: tenants.createdAt,
      matchedDomain,
      total: sql<number>`count(*) over ()`.mapWith(Number),
    })
    .from(tenants)
    .where(where)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  const [firstRow] = pageRows;
  const total = firstRow
    ? firstRow.total
    : offset > 0
      ? await countMatches(where)
      : 0;

  return {
    rows: pageRows.map((row) => ({
      id: row.id,
      name: row.name,
      primaryDomain: row.primaryDomain,
      plan: row.plan,
      status: row.status,
      provisioningStatus: row.provisioningStatus,
      deprovisionedAt: row.deprovisionedAt,
      createdAt: row.createdAt,
      matchedDomain: row.matchedDomain ?? undefined,
    })),
    total,
  };
}
