import 'server-only';

import { TENANTS_PAGE_SIZE } from '@platform/constants/tenant';
import { resolveTotalPages } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { queries } from '@shinefold/db';
import type { TTenantsPage } from '@shinefold/db/queries/tenants/list-tenants-page/list-tenants-page';

export type TTenantsPageData = TTenantsPage & { totalPages: number };

export const loadTenantsPage = async (
  listQuery: TTenantsListQuery,
): Promise<TTenantsPageData> => {
  const { shouldShowArchived, sort, search, page } = listQuery;
  const { rows, total } = await queries.tenants.listTenantsPage({
    includeArchived: shouldShowArchived,
    sort,
    search,
    page,
    pageSize: TENANTS_PAGE_SIZE,
  });
  const totalPages = resolveTotalPages({
    page,
    total,
    pageSize: TENANTS_PAGE_SIZE,
    pageHref: (target) => adminRoutes.tenants({ ...listQuery, page: target }),
  });

  return { rows, total, totalPages };
};
