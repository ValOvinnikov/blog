import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';

import { tagPaginationParamsQuery } from './query';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    tenant,
    ...isr(['page_tag', 'template_tag', 'posts', 'tag'], tenant.projectId),
  });
  return getPaginationParamsWithPageSizes(tagPages, tenant);
}
