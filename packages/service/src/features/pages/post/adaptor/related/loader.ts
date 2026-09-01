import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

import { relatedByTagsQuery, relatedByTopicQuery } from './query';
import { toRelatedPosts } from './transformer';

/**
 * Up to 3 other published posts, ranked by shared-tag count desc then
 * `publishedAt` desc, backfilled from recent posts in the current post's
 * topic when fewer than 3 tag-ranked candidates qualify.
 */
export async function getRelatedPosts(
  currentId: string,
  tagIds: string[],
  topicId: string | undefined,
  tenant?: TTenantSanityContext,
): Promise<TPostCard[]> {
  // Both queries project `postCardFragment`, which derefs `author`/`topic`
  // — both tags must ride alongside `posts` (tag-scope contract,
  // `sanity/query.ts`). `relatedByTagsQuery` additionally derefs `tags[]`
  // via its own extra `tagIds` projection, so its `isr` call also needs
  // `tag`; `relatedByTopicQuery` does not deref tags and stays without it.
  const [byTags, byTopic] = await Promise.all([
    tagIds.length > 0
      ? runQuery(relatedByTagsQuery, {
          parameters: { currentId, tagIds },
          tenant,
          ...isr(['posts', 'author', 'topic', 'tag'], tenant?.projectId),
        })
      : Promise.resolve([]),
    topicId
      ? runQuery(relatedByTopicQuery, {
          parameters: { currentId, topicId },
          tenant,
          ...isr(['posts', 'author', 'topic'], tenant?.projectId),
        })
      : Promise.resolve([]),
  ]);

  return toRelatedPosts(byTags, byTopic, tagIds);
}
