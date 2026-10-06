import type { TLocaleIsoCode } from '@blog/config/constants';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPaginationParam } from '@blog/service/shared/transformers/pagination/to-pagination-params';

import { topicPaginationParamsQuery } from './query';

export async function getTopicPaginationParams(
  tenant: TTenantSanityContext,
  liveLocales: TLocaleIsoCode[],
): Promise<TPaginationParam[]> {
  const topicPages = await runQuery(topicPaginationParamsQuery, {
    parameters: { liveLocales },
    tenant,
    ...isr(
      ['page_topic', 'template_topic', 'posts', 'topic'],
      tenant.projectId,
    ),
  });
  return getPaginationParamsWithPageSizes(topicPages, tenant);
}
