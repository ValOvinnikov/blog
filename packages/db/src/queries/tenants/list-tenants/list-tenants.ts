import {
  SORT_DIRECTION,
  TENANT_SORT_COLUMN,
  type TTenantSortColumn,
} from '@blog/config/constants';
import type { TColumnSort, TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  ilike,
  isNull,
  or,
  type SQL,
} from 'drizzle-orm';

export type TTenantSort = TColumnSort<TTenantSortColumn>;

export type TListTenantsOptions = {
  includeArchived?: boolean;
  sort?: TTenantSort;
  search?: string;
};

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

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function matchesSearch(search: string): TMaybeUndefined<SQL> {
  const pattern = `%${escapeLikePattern(search)}%`;
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

export async function listTenants({
  includeArchived = false,
  sort = DEFAULT_SORT,
  search = '',
}: TListTenantsOptions = {}): Promise<TTenant[]> {
  const order = sort.direction === SORT_DIRECTION.ASCENDING ? asc : desc;
  const trimmedSearch = search.trim();

  return getDb()
    .select()
    .from(tenants)
    .where(
      and(
        includeArchived ? undefined : isNull(tenants.deprovisionedAt),
        trimmedSearch ? matchesSearch(trimmedSearch) : undefined,
      ),
    )
    .orderBy(
      order(SORT_COLUMNS[sort.column]),
      asc(tenants.name),
      asc(tenants.id),
    );
}
