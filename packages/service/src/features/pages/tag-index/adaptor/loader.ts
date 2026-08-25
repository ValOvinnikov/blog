import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingTaxonomyListError } from '@blog/service/features/pages/tag-index/adaptor/missing-taxonomy-list-error';
import { isr, runQuery } from '@blog/service/sanity/query';

import { tagIndexPageQuery } from './query';
import { toTagIndexPage } from './transformer';
import type { TTagIndexPage } from './types';

export async function getIndexPage(): Promise<TMaybeUndefined<TTagIndexPage>> {
  // `tagIndexPageQuery` derefs `taxonomyList` — that tag must ride
  // alongside `page_tagIndex` (tag-scope contract, `sanity/query.ts`).
  const rawPage = await runQuery(
    tagIndexPageQuery,
    isr(['page_tagIndex', 'modules:taxonomyList']),
  );
  if (!rawPage) return undefined;
  if (!rawPage.taxonomyList) {
    throw new MissingTaxonomyListError();
  }

  const settings = await getSiteSettings();
  return toTagIndexPage(rawPage, settings, rawPage.taxonomyList._id);
}
