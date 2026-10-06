import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getFirstPostListPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/page-sizes';
import { toPaginationParams } from '@blog/service/shared/transformers/pagination/to-pagination-params';

import { topicPaginationParamsQuery } from './query';

export async function getTopicPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const topicPages = await runQuery(topicPaginationParamsQuery, {
    tenant,
    ...isr(
      ['page_topic', 'template_topic', 'posts', 'topic'],
      tenant.projectId,
    ),
  });
  const pageSizes = await getFirstPostListPageSizes(
    topicPages.map(({ moduleRefs }) => moduleRefs),
    tenant,
  );

  return toPaginationParams(
    topicPages.map(({ slug, postCount }, index) => ({
      slug,
      postCount,
      pageSize: pageSizes[index] ?? null,
    })),
  );
}
