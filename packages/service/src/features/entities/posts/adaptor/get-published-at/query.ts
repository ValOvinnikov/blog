import { q } from '@blog/service/sanity/query/query';

export type TPostPublishedAtQueryParams = {
  id: string;
};

/** Unfiltered by publish date, so a post scheduled for later still resolves. */
export const postPublishedAtQuery = q
  .parameters<TPostPublishedAtQueryParams>()
  .star.filterByType('page_post')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    publishedAt: sub.field('publishedAt').notNull(),
  }))
  .nullable(true);
