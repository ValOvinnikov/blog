import { q } from '@shinefold/service/sanity/query/query';

export type TRedirectSourceQueryParams = { id: string };

export const redirectSourceQuery = q
  .parameters<TRedirectSourceQueryParams>()
  .star.filterByType('redirect')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    source: sub.field('source').notNull(),
    language: sub.field('language').notNull(),
    isPrefix: sub.field('isPrefix').nullable(true),
  }))
  .nullable(true);
