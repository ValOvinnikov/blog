import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicParamsQuery } from './query';

export async function getTopicParams(
  tenant?: TTenantSanityContext,
): Promise<{ slug: string }[]> {
  return runQuery(topicParamsQuery, {
    tenant,
    ...isr('page_topic', tenant?.projectId),
  });
}
