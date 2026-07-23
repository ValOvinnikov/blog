import { buildTagPostsPageQuery } from '@blog/service/features/pages/tag/adaptor/detail-page/posts.query';
import { tagParamsQuery } from '@blog/service/features/pages/tag/adaptor/detail-page-params/query';
import { isr, runQuery } from '@blog/service/sanity/query';

import { toTagPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every tag's pages 2…N. Each tag
 * needs its own post count, so this fans out one count-only query per tag
 * slug (in parallel) after listing the slugs — there is no single GROQ
 * projection that correlates a tag's own slug into its post count without
 * per-document scoping.
 *
 * `itemsPerPage` has no default here — tags have no CMS-authored page-size
 * field like `page_blog.itemsPerPage`, so the caller must pass the same
 * value it also passes to `getTagPage`'s `itemsPerPage` arg, or the two
 * will disagree on how many pages exist.
 */
export async function getTagPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const tags = await runQuery(tagParamsQuery, isr('tags'));
  const totals = await Promise.all(
    tags.map(async ({ slug }) => {
      const { total } = await runQuery(buildTagPostsPageQuery(0, 0), {
        parameters: { slug },
        ...isr('posts'),
      });
      return { slug, total };
    }),
  );
  return toTagPaginationParams(totals, itemsPerPage);
}
