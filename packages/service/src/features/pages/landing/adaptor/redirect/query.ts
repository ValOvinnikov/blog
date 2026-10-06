import { q } from '@blog/service/sanity/query/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const redirectsQuery = q
  .parameters<TLocaleParams>()
  .star.filterByType('redirect')
  .filterBy('language == $locale')
  .project((sub) => ({
    source: sub.field('source').notNull(),
    destination: sub.field('destination').notNull(),
    isPrefix: sub.field('isPrefix').nullable(true),
  }));
