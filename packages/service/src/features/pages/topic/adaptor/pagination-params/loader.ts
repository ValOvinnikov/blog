import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

import { topicPaginationParamsQuery } from './query';
import type { TTopicPaginatedPage } from './types';

export async function getTopicPaginatedPages(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TTopicPaginatedPage[]> {
  return runQuery(topicPaginationParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr(
      ['page_topic', 'template_topic', 'posts', 'topic'],
      tenant.projectId,
    ),
  });
}
