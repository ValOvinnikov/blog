import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { topicPageQuery } from './query';
import { toTopicDetailPage } from './transformer';
import type { TTopicDetailPage } from './types';

export async function getTopicPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicDetailPage>> {
  const rawPage = await runQuery(topicPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_topic', 'topic'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toTopicDetailPage(rawPage);
}
