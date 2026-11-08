import { q } from '@blog/service/sanity/query/query';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { translationsQuery } from '@blog/service/shared/localization/page-translations/translations';
import type { TPageQueryParams } from '@blog/service/shared/types/page/page-query-params';
import type { TSectionDocumentType } from '@blog/service/shared/types/page/section-document-type';

export const sectionDocumentPageQuery = q
  .parameters<TPageQueryParams & { type: TSectionDocumentType }>()
  .star.filterByType('page_privacyDocument', 'page_legalDocument')
  .filterBy('_type == $type')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    _id: true,
    _type: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    kind: sub.field('kind').notNull(),
    body: sub
      .field('content[]')
      .project(portableTextBodyItemFragment)
      .notNull(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
