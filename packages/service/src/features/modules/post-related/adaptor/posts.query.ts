import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

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
export const relatedByTagsQuery = publishedPostsInLocale(
  q.parameters<TLocaleParams & TRelatedByTagsParams>().star,
)
  .filterBy('_id != $currentId')
  // groqd's typed filterBy has no `count` function call
  .filterRaw('count(tags[_ref in $tagIds]) > 0')
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
  return (
    publishedPostsInLocale(
      q.parameters<TLocaleParams & TRelatedByTopicParams>().star,
    )
      .filterBy('_id != $currentId')
      // groqd's typed filterBy cannot reach a reference's `_ref`
      .filterRaw('topic._ref == $topicId')
      .order('publishedAt desc')
      .slice(0, topicCandidateLimit)
      .project(postCardFragment)
  );
}
