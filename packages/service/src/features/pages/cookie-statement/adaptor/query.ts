import { q } from '@blog/service/sanity/query/query';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { pageLanguagesQuery } from '@blog/service/shared/localization/page-languages/page-languages';

export const cookieStatementPageQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_cookieStatement')
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    body: sub
      .field('content[]')
      .project(portableTextBodyItemFragment)
      .notNull(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: pageLanguagesQuery('page_cookieStatement'),
  }))
  .nullable(true);
