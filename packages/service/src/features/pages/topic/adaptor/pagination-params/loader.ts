import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';

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
  return getPaginationParamsWithPageSizes(topicPages, tenant);
}
