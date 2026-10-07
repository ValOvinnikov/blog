import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const redirectsQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('redirect')
  .filterBy('language == $locale')
  .project((sub) => ({
    source: sub.field('source').notNull(),
    destination: sub.field('destination').notNull(),
    isPrefix: sub.field('isPrefix').nullable(true),
  }));
