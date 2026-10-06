import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

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
    tagIds.length > 0
      ? runQuery(relatedByTagsQuery, {
          parameters: { currentId: postId, tagIds },
          tenant,
          ...isr(['posts', 'author', 'topic', 'tag'], tenant.projectId),
        })
      : Promise.resolve([]),
    topicId
      ? runQuery(
          relatedByTopicQuery(limit * RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER),
          {
            parameters: { currentId: postId, topicId },
            tenant,
            ...isr(['posts', 'author', 'topic'], tenant.projectId),
          },
        )
      : Promise.resolve([]),
  ]);

  return toRelatedPosts(byTags, byTopic, tagIds, limit);
}
