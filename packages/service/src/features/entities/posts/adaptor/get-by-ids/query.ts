import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

export type TPostsByIdsParams = {
  ids: string[];
};

/**
 * Resolves an explicit `_id` allow-list (e.g. a reader's bookmarked post
 * ids) to post-card data. The `_type`/`PUBLISHED_POST_FILTER`/
 * `POST_CONTENT_READY_FILTER` filters do double duty as the "no longer
 * resolves" exclusion — an id that was deleted, unpublished, future-dated,
 * or not yet content-complete simply doesn't match, so it's silently absent
 * from the result rather than causing an error.
 */
export const postsByIdsQuery = q
  .parameters<TPostsByIdsParams>()
  .star.filterByType('page_post')
  .filterRaw('_id in $ids')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw(POST_CONTENT_READY_FILTER)
  .project(postCardFragment);
