import { parsePage } from '@platform/utils/pagination/pagination';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';
import type { TMaybeUndefined, TSearchParam } from '@shinefold/config/types';
import type { TTenantSort } from '@shinefold/db/queries/tenants/list-tenants';
import { z } from 'zod';

export type TTenantsListQuery = {
  shouldShowArchived: boolean;
  sort: TTenantSort;
  search: string;
  page: number;
};

export type TTenantsListSearchParams = {
  archived?: TSearchParam;
  sort?: TSearchParam;
  direction?: TSearchParam;
  q?: TSearchParam;
  page?: TSearchParam;
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

export const MAX_TENANT_SEARCH_LENGTH = 100;

const searchSchema = z
  .string()
  .trim()
  .transform((search) => search.slice(0, MAX_TENANT_SEARCH_LENGTH))
  .catch('');

const firstValue = (param: TSearchParam): TMaybeUndefined<string> =>
  Array.isArray(param) ? param[0] : param;

export const parseTenantsListQuery = ({
  archived,
  sort,
  direction,
  q,
  page,
}: TTenantsListSearchParams): TTenantsListQuery => ({
  shouldShowArchived: firstValue(archived) === ARCHIVED_PARAM_ON,
  sort: sortSchema.parse({
    column: firstValue(sort),
    direction: firstValue(direction),
  }),
  search: searchSchema.parse(firstValue(q)),
  page: parsePage(firstValue(page)),
});
