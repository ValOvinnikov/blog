import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingPostListError } from '@blog/service/features/pages/tag/adaptor/missing-post-list-error';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagPageQuery } from './query';
import { toTagDetailPage } from './transformer';
import type { TTagDetailPage } from './types';

export async function getTagPage(
  slug: string,
  tenant?: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagDetailPage>> {
  // `tagPageQuery` derefs `tag` and `postList` — both tags must ride
  // alongside `page_tag` (tag-scope contract, `sanity/query.ts`).
  const rawPage = await runQuery(tagPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_tag', 'tag', 'modules:postList'], tenant?.projectId),
  });
  if (!rawPage) return undefined;
  if (!rawPage.postList) {
    throw new MissingPostListError();
  }

  const settings = await getSiteSettings(tenant);
  return toTagDetailPage(rawPage, settings, rawPage.postList._id);
}
