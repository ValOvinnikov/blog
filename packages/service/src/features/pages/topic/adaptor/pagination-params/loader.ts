import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { toPaginationParams } from '@blog/service/shared/transformers/to-pagination-params';

import { topicPaginationParamsQuery } from './query';

export async function getTopicPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const topicPages = await runQuery(topicPaginationParamsQuery, {
    tenant,
    ...isr(
      ['page_topic', 'modules:postList', 'posts', 'topic'],
      tenant.projectId,
    ),
  });
  return toPaginationParams(topicPages);
}
