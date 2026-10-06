import { q } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

import { RELATED_POSTS_TAG_CANDIDATE_LIMIT } from './constants';

export type TAnchorPostParams = {
  postId: string;
};

export type TRelatedByTagsParams = {
  currentId: string;
  tagIds: string[];
};

export type TRelatedByTopicParams = {
  currentId: string;
  topicId: string;
};

export const relatedPostAnchorQuery = q
  .parameters<TAnchorPostParams>()
  .star.filterByType('page_post')
  .filterBy('_id == $postId')
  .slice(0)
  .project((sub) => ({
    tagIds: sub
      .field('tags[]')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
    topicId: sub
      .field('topic')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
  }))
  .nullable(true);

// groqd's typed `.order()` takes no raw `count(...)`, so the shared-tag ranking runs in JS (`toRelatedPosts`).
export const relatedByTagsQuery = q
  .parameters<TRelatedByTagsParams>()
  .star.filterByType('page_post')
  .filterRaw('_id != $currentId && count(tags[_ref in $tagIds]) > 0')
  .filterRaw(POST_IN_LOCALE_FILTER)
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0, RELATED_POSTS_TAG_CANDIDATE_LIMIT)
  .project((sub) => ({
    ...postCardFragment,
    tagIds: sub
      .field('tags[]')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
  }));

export function relatedByTopicQuery(topicCandidateLimit: number) {
  return q
    .parameters<TRelatedByTopicParams>()
    .star.filterByType('page_post')
    .filterRaw('_id != $currentId && topic._ref == $topicId')
    .filterRaw(POST_IN_LOCALE_FILTER)
    .filterRaw(PUBLISHED_POST_FILTER)
    .order('publishedAt desc')
    .slice(0, topicCandidateLimit)
    .project(postCardFragment);
}
