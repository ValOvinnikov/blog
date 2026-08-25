import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingTaxonomyListError } from '@blog/service/features/pages/topic-index/adaptor/missing-taxonomy-list-error';
import { isr, runQuery } from '@blog/service/sanity/query';

import { topicIndexPageQuery } from './query';
import { toTopicIndexPage } from './transformer';
import type { TTopicIndexPage } from './types';

export async function getIndexPage(): Promise<
  TMaybeUndefined<TTopicIndexPage>
> {
  // `topicIndexPageQuery` derefs `taxonomyList` — that tag must ride
  // alongside `page_topicIndex` (tag-scope contract, `sanity/query.ts`).
  const [rawPage, settings] = await Promise.all([
    runQuery(
      topicIndexPageQuery,
      isr(['page_topicIndex', 'modules:taxonomyList']),
    ),
    getSiteSettings(),
  ]);
  if (!rawPage) return undefined;
  if (!rawPage.taxonomyList) {
    throw new MissingTaxonomyListError();
  }
  return toTopicIndexPage(rawPage, settings, rawPage.taxonomyList._id);
}
