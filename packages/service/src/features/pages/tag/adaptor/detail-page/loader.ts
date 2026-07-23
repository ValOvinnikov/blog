import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { buildTagPostsPageQuery, tagPagePostsQuery } from './posts.query';
import { tagPageTagQuery } from './tag.query';
import { toTagPage } from './transformer';
import type { TTagPage } from './types';

type TGetTagPageArgs =
  | { page?: undefined; itemsPerPage?: undefined }
  | { page: number; itemsPerPage: number };

/**
 * `page` is left undefined for an unpaginated call site, which fetches
 * every post for the tag in one unsliced query. Passing a `page` opts into
 * the sliced, paginated query — tags have no CMS-authored page-size field
 * like `page_blog.itemsPerPage`, so `itemsPerPage` is required alongside
 * `page`; the caller (the `/tag/[slug]/page/[page]` route) decides the
 * value. Populates `currentPage`/`totalPages`/`total` on the returned
 * view-model.
 */
export async function getTagPage(
  slug: string,
  { page, itemsPerPage }: TGetTagPageArgs = {},
): Promise<TTagPage | null> {
  if (page === undefined) {
    const [rawTag, rawPosts, settings] = await Promise.all([
      runQuery(tagPageTagQuery, {
        parameters: { slug },
        ...isr('tag'),
      }),
      runQuery(tagPagePostsQuery, {
        parameters: { slug },
        ...isr('posts'),
      }),
      getSiteSettings(),
    ]);
    if (!rawTag) return null;
    return toTagPage(rawTag, rawPosts, settings);
  }

  const start = (page - 1) * itemsPerPage;
  const [rawTag, rawPosts, settings] = await Promise.all([
    runQuery(tagPageTagQuery, {
      parameters: { slug },
      ...isr('tag'),
    }),
    runQuery(buildTagPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr('posts'),
    }),
    getSiteSettings(),
  ]);
  if (!rawTag) return null;
  return toTagPage(rawTag, rawPosts.posts, settings, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
    total: rawPosts.total,
  });
}
