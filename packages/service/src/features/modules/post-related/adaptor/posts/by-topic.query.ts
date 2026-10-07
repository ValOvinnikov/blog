import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

export type TRelatedByTopicQueryParams = {
  currentId: string;
  topicId: string;
};

export function relatedByTopicQuery(topicCandidateLimit: number) {
  return (
    publishedPostsInLocale(
      q.parameters<TLocaleQueryParams & TRelatedByTopicQueryParams>().star,
    )
      .filterBy('_id != $currentId')
      // groqd's typed filterBy cannot reach a reference's `_ref`
      .filterRaw('topic._ref == $topicId')
      .order('publishedAt desc')
      .slice(0, topicCandidateLimit)
      .project(postCardFragment)
  );
}
