import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingPostListError } from '@blog/service/features/pages/topic/adaptor/missing-post-list-error';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicPageQuery } from './query';
import { toTopicDetailPage } from './transformer';
import type { TTopicDetailPage } from './types';

export async function getTopicPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicDetailPage>> {
  // `topicPageQuery` derefs `topic` and `postList` — both tags must ride
  // alongside `page_topic` (tag-scope contract, `sanity/query.ts`).
  const rawPage = await runQuery(topicPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_topic', 'topic', 'modules:postList'], tenant.projectId),
  });
  if (!rawPage) return undefined;
  if (!rawPage.postList) {
    throw new MissingPostListError();
  }

  const settings = await getSiteSettings(tenant);
  return toTopicDetailPage(rawPage, settings, rawPage.postList._id);
}
