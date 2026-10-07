import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

import { RELATED_POSTS_TAG_CANDIDATE_LIMIT } from './constants';

export type TRelatedByTagsParams = {
  currentId: string;
  tagIds: string[];
};

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
