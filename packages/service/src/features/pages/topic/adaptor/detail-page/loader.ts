import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { topicPageQuery } from './query';
import { toTopicDetailPage } from './transformer';
import type { TTopicDetailPageDocument } from './types';

export async function getTopicPageDocument(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicDetailPageDocument>> {
  const rawPage = await runQuery(topicPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_topic', 'template_topic', 'topic'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toTopicDetailPage(rawPage);
}
