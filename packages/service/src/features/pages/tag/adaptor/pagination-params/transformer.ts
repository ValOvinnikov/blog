import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { tagPaginationParamsQuery } from './query';

export type TRawTagPaginationParams = InferResultType<
  typeof tagPaginationParamsQuery
>[number];

/**
 * Raw per-tag-page slug + post count + archive page size → the
 * `{ slug, page }` array for pages 2…N (page 1 is `/tags/[slug]`).
 *
 * A `page_tag` missing its `postList` slot contributes no entries here
 * rather than failing the whole site's static params — unlike the
 * single-document `page_blog`/`page_tagIndex` loaders, this query spans
 * every tag page in one round-trip, so one unfinished tag page must not
 * block every other tag's pagination. The detail page for that specific tag
 * still throws `MissingPostListError` when rendered.
 */
export function toTagPaginationParams(
  tagPages: TRawTagPaginationParams[],
): { slug: string; page: string }[] {
  return tagPages.flatMap(({ slug, postList, postCount }) => {
    if (!postList) return [];
    const totalPages = toTotalPages(postCount, postList.pageSize);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
