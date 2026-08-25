import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingPostListError } from '@blog/service/features/pages/topic/adaptor/missing-post-list-error';
import { isr, runQuery } from '@blog/service/sanity/query';

import { topicPageQuery } from './query';
import { toTopicDetailPage } from './transformer';
import type { TTopicDetailPage } from './types';

export async function getTopicPage(
  slug: string,
): Promise<TMaybeUndefined<TTopicDetailPage>> {
  // `topicPageQuery` derefs `topic` and `postList` — both tags must ride
  // alongside `page_topic` (tag-scope contract, `sanity/query.ts`).
  const [rawPage, settings] = await Promise.all([
    runQuery(topicPageQuery, {
      parameters: { slug },
      ...isr(['page_topic', 'topic', 'modules:postList']),
    }),
    getSiteSettings(),
  ]);
  if (!rawPage) return undefined;
  if (!rawPage.postList) {
    throw new MissingPostListError();
  }
  return toTopicDetailPage(rawPage, settings, rawPage.postList._id);
}
