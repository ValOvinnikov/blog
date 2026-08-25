import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingPostListError } from '@blog/service/features/pages/blog/adaptor/missing-post-list-error';
import { isr, runQuery } from '@blog/service/sanity/query';

import { blogPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export async function getIndexPage(): Promise<TMaybeUndefined<TBlogIndexPage>> {
  // `blogPageQuery` derefs `postList` — that tag must ride alongside
  // `page_blog` (tag-scope contract, `sanity/query.ts`).
  const [rawPage, settings] = await Promise.all([
    runQuery(blogPageQuery, isr(['page_blog', 'modules:postList'])),
    getSiteSettings(),
  ]);
  if (!rawPage) return undefined;
  if (!rawPage.postList) {
    throw new MissingPostListError();
  }
  return toIndexPage(rawPage, settings, rawPage.postList._id);
}
