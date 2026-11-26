import { getDb } from '@shinefold/db/client';
import {
  buildTenantListCriteria,
  type TTenantListFilters,
} from '@shinefold/db/queries/tenants/tenant-list-criteria';
import {
  tenantsPageRowColumns,
  toTenantsPageRow,
  type TTenantsPageRow,
} from '@shinefold/db/queries/tenants/tenants-page-row';
import { tenants } from '@shinefold/db/schema/tenants';
import { count, sql } from 'drizzle-orm';

export type TTenantsPageRequest = TTenantListFilters & {
  page: number;
  pageSize: number;
};

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
      ...tenantsPageRowColumns,
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
    rows: pageRows.map(toTenantsPageRow),
    total,
  };
}
