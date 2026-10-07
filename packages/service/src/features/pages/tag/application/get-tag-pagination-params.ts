import { getTagPaginatedPages } from '@blog/service/features/pages/tag/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPaginationParam } from '@blog/service/shared/transformers/pagination/to-pagination-params';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TPaginationParam[]> {
  const pages = await getTagPaginatedPages(tenant, locales);

  return getPaginationParamsWithPageSizes(pages, tenant);
}
