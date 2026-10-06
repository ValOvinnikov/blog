import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPaginationParam } from '@blog/service/shared/transformers/pagination/to-pagination-params';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

import { tagPaginationParamsQuery } from './query';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TPaginationParam[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr(['page_tag', 'template_tag', 'posts', 'tag'], tenant.projectId),
  });
  return getPaginationParamsWithPageSizes(tagPages, tenant);
}
