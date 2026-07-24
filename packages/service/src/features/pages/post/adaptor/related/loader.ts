import { isr, runQuery } from '@blog/service/sanity/query';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

import { relatedByCategoryQuery, relatedByTagsQuery } from './query';
import { toRelatedPosts } from './transformer';

/**
 * Up to 3 other published posts, ranked by shared-tag count desc then
 * `publishedAt` desc, backfilled from recent posts in the current post's
 * category when fewer than 3 tag-ranked candidates qualify.
 */
export async function getRelatedPosts(
  currentId: string,
  tagIds: string[],
  categoryId: string | undefined,
): Promise<TPostCard[]> {
  // Both queries project `postCardFragment`, which derefs `author`/
  // `category` — both tags must ride alongside `posts` (tag-scope
  // contract, `sanity/query.ts`).
  const [byTags, byCategory] = await Promise.all([
    tagIds.length > 0
      ? runQuery(relatedByTagsQuery, {
          parameters: { currentId, tagIds },
          ...isr(['posts', 'author', 'category']),
        })
      : Promise.resolve([]),
    categoryId
      ? runQuery(relatedByCategoryQuery, {
          parameters: { currentId, categoryId },
          ...isr(['posts', 'author', 'category']),
        })
      : Promise.resolve([]),
  ]);

  return toRelatedPosts(byTags, byCategory, tagIds);
}
