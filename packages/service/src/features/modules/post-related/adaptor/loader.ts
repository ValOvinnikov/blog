import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER } from './constants';
import {
  relatedByTagsQuery,
  relatedByTopicQuery,
  relatedPostAnchorQuery,
} from './posts.query';
import { postRelatedModuleQuery } from './query';
import { toPostRelatedModule, toRelatedPosts } from './transformer';
import type { TPostRelatedModule } from './types';

/**
 * Resolves `module_postRelated`'s own fields alongside up to `limit` other
 * published posts related to `postId` — shared-tag rank descending, then
 * `publishedAt` descending, backfilled from the same topic.
 */
export async function getPostRelated(
  id: string,
  postId: string,
  tenant: TTenantSanityContext,
): Promise<TPostRelatedModule> {
  const raw = await runQuery(postRelatedModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postRelated', `module:${id}`], tenant.projectId),
  });

  // `relatedPostAnchorQuery` derefs the anchor post's own `tags[]`/`topic` —
  // both tags must ride alongside `posts` (tag-scope contract,
  // `sanity/query.ts`).
  const anchor = await runQuery(relatedPostAnchorQuery, {
    parameters: { postId },
    tenant,
    ...isr(['posts', 'topic', 'tag'], tenant.projectId),
  });

  const tagIds = (anchor?.tagIds ?? []).map((tag) => tag._id);
  const topicId = anchor?.topicId?._id;

  const [byTags, byTopic] = await Promise.all([
    tagIds.length > 0
      ? runQuery(relatedByTagsQuery, {
          parameters: { currentId: postId, tagIds },
          tenant,
          ...isr(['posts', 'author', 'topic', 'tag'], tenant.projectId),
        })
      : Promise.resolve([]),
    topicId
      ? runQuery(
          relatedByTopicQuery(
            raw.limit * RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER,
          ),
          {
            parameters: { currentId: postId, topicId },
            tenant,
            ...isr(['posts', 'author', 'topic'], tenant.projectId),
          },
        )
      : Promise.resolve([]),
  ]);

  const posts = toRelatedPosts(byTags, byTopic, tagIds, raw.limit);

  return toPostRelatedModule(raw, posts);
}
