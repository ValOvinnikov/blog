import { getTagPaginatedPages } from '@shinefold/service/features/pages/tag/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@shinefold/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPaginationParam } from '@shinefold/service/shared/transformers/pagination/to-pagination-params';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TPaginationParam[]> {
  const pages = await getTagPaginatedPages(tenant, locales);

  return getPaginationParamsWithPageSizes(pages, tenant);
}
