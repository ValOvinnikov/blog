import {
  SORT_DIRECTION,
  TENANT_SORT_COLUMN,
  type TTenantSortColumn,
} from '@blog/config/constants';
import type {
  TColumnSort,
  TMaybeNull,
  TMaybeUndefined,
} from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

export type TTenantSort = TColumnSort<TTenantSortColumn>;

export type TListTenantsOptions = {
  includeArchived?: boolean;
  sort?: TTenantSort;
  search?: string;
};

export type TListedTenant = TTenant & { matchedDomain?: string };

const SORT_COLUMNS = {
  [TENANT_SORT_COLUMN.NAME]: tenants.name,
  [TENANT_SORT_COLUMN.PLAN]: tenants.plan,
  [TENANT_SORT_COLUMN.STATUS]: tenants.status,
  [TENANT_SORT_COLUMN.CREATED]: tenants.createdAt,
} satisfies Record<TTenantSortColumn, unknown>;

const DEFAULT_SORT: TTenantSort = {
  column: TENANT_SORT_COLUMN.NAME,
  direction: SORT_DIRECTION.ASCENDING,
};

function toLikePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

function matchesSearch(pattern: string): TMaybeUndefined<SQL> {
  const matchingDomain = getDb()
    .select({ id: tenantDomains.id })
    .from(tenantDomains)
    .where(
      and(
        eq(tenantDomains.tenantId, tenants.id),
        ilike(tenantDomains.domain, pattern),
      ),
    );

  return or(
    ilike(tenants.name, pattern),
    ilike(tenants.primaryDomain, pattern),
    exists(matchingDomain),
  );
}

function matchedExtraDomain(pattern: string): SQL<TMaybeNull<string>> {
  return sql<TMaybeNull<string>>`case
    when ${ilike(tenants.name, pattern)} or ${ilike(tenants.primaryDomain, pattern)} then null
    else (
      select ${tenantDomains.domain} from ${tenantDomains}
      where ${eq(tenantDomains.tenantId, tenants.id)} and ${ilike(tenantDomains.domain, pattern)}
      order by ${tenantDomains.domain}
      limit 1
    )
  end`;
}

export async function listTenants({
  includeArchived = false,
  sort = DEFAULT_SORT,
  search = '',
}: TListTenantsOptions = {}): Promise<TListedTenant[]> {
  const order = sort.direction === SORT_DIRECTION.ASCENDING ? asc : desc;
  const trimmedSearch = search.trim();
  const pattern = toLikePattern(trimmedSearch);

  const rows = await getDb()
    .select({
      ...getTableColumns(tenants),
      matchedDomain: trimmedSearch
        ? matchedExtraDomain(pattern)
        : sql<TMaybeNull<string>>`null`,
    })
    .from(tenants)
    .where(
      and(
        includeArchived ? undefined : isNull(tenants.deprovisionedAt),
        trimmedSearch ? matchesSearch(pattern) : undefined,
      ),
    )
    .orderBy(
      order(SORT_COLUMNS[sort.column]),
      asc(tenants.name),
      asc(tenants.id),
    );

  return rows.map(({ matchedDomain, ...tenant }) => ({
    ...tenant,
    matchedDomain: matchedDomain ?? undefined,
  }));
}
