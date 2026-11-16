import { getTopicPaginatedPages } from '@shinefold/service/features/pages/topic/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@shinefold/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPaginationParam } from '@shinefold/service/shared/transformers/pagination/to-pagination-params';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

export async function getTopicPaginationParams(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TPaginationParam[]> {
  const pages = await getTopicPaginatedPages(tenant, locales);

  return getPaginationParamsWithPageSizes(pages, tenant);
}
