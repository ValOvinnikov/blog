import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { hasLength } from '@blog/utils/primitives';

import { relatedPostAnchorQuery } from './anchor.query';
import { relatedByTagsQuery } from './by-tags.query';
import { relatedByTopicQuery } from './by-topic.query';
import { RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER } from './constants';
import { toRelatedPosts } from './transformer';

export async function getRelatedPosts(
  postId: string,
  limit: number,
  tenant: TTenantSanityContext,
): Promise<TPostCard[]> {
  const anchor = await runQuery(relatedPostAnchorQuery, {
    parameters: { postId },
    tenant,
    ...isr(['posts', 'topic', 'tag'], tenant.projectId),
  });

  const tagIds = (anchor?.tagIds ?? []).map((tag) => tag._id);
  const topicId = anchor?.topicId?._id;

  const [byTags, byTopic] = await Promise.all([
    hasLength(tagIds)
      ? runQuery(relatedByTagsQuery, {
          parameters: { currentId: postId, tagIds },
          tenant,
          ...isr(
            ['posts', 'author', 'topic', 'tag', ...LINK_TARGET_CACHE_TAGS],
            tenant.projectId,
          ),
        })
      : Promise.resolve([]),
    topicId
      ? runQuery(
          relatedByTopicQuery(limit * RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER),
          {
            parameters: { currentId: postId, topicId },
            tenant,
            ...isr(
              ['posts', 'author', 'topic', ...LINK_TARGET_CACHE_TAGS],
              tenant.projectId,
            ),
          },
        )
      : Promise.resolve([]),
  ]);

  return toRelatedPosts(byTags, byTopic, tagIds, limit);
}
