import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getFirstPostListPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/page-sizes';

import { indexPageParamsQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(
  tenant: TTenantSanityContext,
): Promise<{ page: string }[]> {
  const raw = await runQuery(indexPageParamsQuery, {
    tenant,
    ...isr(['posts', 'page_postIndex', 'template_postIndex'], tenant.projectId),
  });
  const [pageSize = null] = await getFirstPostListPageSizes(
    [raw.moduleRefs],
    tenant,
  );

  return toIndexPageParams({ blogPosts: raw.blogPosts, pageSize });
}
