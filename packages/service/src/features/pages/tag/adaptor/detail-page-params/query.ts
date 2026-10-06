import type { TLocaleIsoCode } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';

export const tagParamsQuery = q
  .parameters<{ liveLocales: TLocaleIsoCode[] }>()
  .star.filterByType('page_tag')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('language in $liveLocales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.field('language').notNull(),
  }));
