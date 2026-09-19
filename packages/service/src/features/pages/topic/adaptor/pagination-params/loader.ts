import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicPaginationParamsQuery } from './query';
import { toTopicPaginationParams } from './transformer';

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
  return toTopicPaginationParams(topicPages);
}
