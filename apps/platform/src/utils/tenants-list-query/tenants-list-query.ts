import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import type { TTenantSort } from '@blog/db/queries/tenants/list-tenants';
import { z } from 'zod';

export type TTenantsListQuery = {
  shouldShowArchived: boolean;
  sort: TTenantSort;
  search: string;
};

export type TTenantsListSearchParams = {
  archived?: string;
  sort?: string;
  direction?: string;
  q?: string;
};

export const ARCHIVED_PARAM_ON = '1';

export const DEFAULT_TENANTS_SORT: TTenantSort = {
  column: TENANT_SORT_COLUMN.CREATED,
  direction: SORT_DIRECTION.DESCENDING,
};

const sortSchema = z
  .object({
    column: z.enum(TENANT_SORT_COLUMN),
    direction: z.enum(SORT_DIRECTION),
  })
  .catch(DEFAULT_TENANTS_SORT);

export const parseTenantsListQuery = ({
  archived,
  sort,
  direction,
  q,
}: TTenantsListSearchParams): TTenantsListQuery => ({
  shouldShowArchived: archived === ARCHIVED_PARAM_ON,
  sort: sortSchema.parse({ column: sort, direction }),
  search: q?.trim() ?? '',
});
