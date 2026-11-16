import { q } from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';
import type { TSectionDocumentType } from '@shinefold/service/shared/types/page/section-document-type';

export const sectionDocumentParamsQuery = q
  .parameters<TPageQueryPageParams & { type: TSectionDocumentType }>()
  .star.filterByType('page_privacyDocument', 'page_legalDocument')
  .filterBy('_type == $type')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('language in $locales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.field('language').notNull(),
  }));
