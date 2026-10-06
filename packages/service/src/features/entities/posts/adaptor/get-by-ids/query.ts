import { q } from '@blog/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

export type TPostsByIdsParams = {
  ids: string[];
};

/** Unscoped by language, so a saved post resolves in the language it was saved in; an id that no longer resolves is simply absent. */
export const postsByIdsQuery = q
  .parameters<TPostsByIdsParams>()
  .star.filterByType('page_post')
  .filterRaw('_id in $ids')
  .filterRaw(PUBLISHED_POST_FILTER)
  .project((sub) => ({
    ...postCardFragment,
    language: sub.field('language').notNull(),
  }));
