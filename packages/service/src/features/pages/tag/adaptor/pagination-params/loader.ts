import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { toPaginationParams } from '@blog/service/shared/transformers/pagination/to-pagination-params';

import { tagPaginationParamsQuery } from './query';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    tenant,
    ...isr(['page_tag', 'modules:postList', 'posts', 'tag'], tenant.projectId),
  });
  return toPaginationParams(tagPages);
}
