import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const pageTitleQuery = q
  .parameters<TLocaleQueryParams & { id: string }>()
  .star.filterByType(
    'page_home',
    'page_landing',
    'page_privacyDocument',
    'page_legalDocument',
    'page_cookieStatement',
  )
  .filterBy('_id == $id')
  // groqd's typed filterBy has no coalesce, and a Home with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
  }))
  .nullable(true);
