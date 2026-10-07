import { q } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

export type TRelatedByTopicQueryParams = {
  currentId: string;
  topicId: string;
};

export function relatedByTopicQuery(topicCandidateLimit: number) {
  return q
    .parameters<TRelatedByTopicQueryParams>()
    .star.filterByType('page_post')
    .filterRaw('_id != $currentId && topic._ref == $topicId')
    .filterRaw(POST_IN_LOCALE_FILTER)
    .filterRaw(PUBLISHED_POST_FILTER)
    .order('publishedAt desc')
    .slice(0, topicCandidateLimit)
    .project(postCardFragment);
}
