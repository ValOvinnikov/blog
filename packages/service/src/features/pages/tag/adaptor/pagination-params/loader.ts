import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getFirstPostListPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/page-sizes';
import { toPaginationParams } from '@blog/service/shared/transformers/pagination/to-pagination-params';

import { tagPaginationParamsQuery } from './query';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    tenant,
    ...isr(['page_tag', 'template_tag', 'posts', 'tag'], tenant.projectId),
  });
  const pageSizes = await getFirstPostListPageSizes(
    tagPages.map(({ moduleRefs }) => moduleRefs),
    tenant,
  );

  return toPaginationParams(
    tagPages.map(({ slug, postCount }, index) => ({
      slug,
      postCount,
      pageSize: pageSizes[index] ?? null,
    })),
  );
}
