import { q } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

import { RELATED_POSTS_TAG_CANDIDATE_LIMIT } from './constants';

export type TRelatedByTagsParams = {
  currentId: string;
  tagIds: string[];
};

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
