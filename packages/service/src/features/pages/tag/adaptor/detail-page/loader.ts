import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { buildTagPostsPageQuery } from './posts.query';
import { tagPageTagQuery } from './tag.query';
import { toTagPage } from './transformer';
import type { TTagPage } from './types';

type TGetTagPageArgs = {
  page?: number;
  itemsPerPage: number;
};

/**
 * Always windows, mirroring the blog index (`getIndexPage`) — `page`
 * defaults to 1 so the unnumbered `/tag/[slug]` route gets the same
 * sliced-query + pagination-metadata shape as `/tag/[slug]/page/[page]`
 * (pages ≥ 2). Tags have no CMS-authored page-size field like
 * `page_blog.itemsPerPage`, so `itemsPerPage` is always required — the
 * caller (`TAG_ITEMS_PER_PAGE` on the web side) decides the value.
 */
export async function getTagPage(
  slug: string,
  { page = 1, itemsPerPage }: TGetTagPageArgs,
): Promise<TTagPage | null> {
  const start = (page - 1) * itemsPerPage;
  const [rawTag, rawPosts, settings] = await Promise.all([
    runQuery(tagPageTagQuery, {
      parameters: { slug },
      ...isr('tag'),
    }),
    // `archivePostCardFragment` derefs `category` — that tag must ride
    // alongside `posts` (tag-scope contract, `sanity/query.ts`).
    runQuery(buildTagPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr(['posts', 'category']),
    }),
    getSiteSettings(),
  ]);
  if (!rawTag) return null;
  return toTagPage(rawTag, rawPosts.posts, settings, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
  });
}
