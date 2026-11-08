import { LEGAL_PAGE_KIND } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import type { TSectionDocumentKind } from './types';

// Studio validation allows one published page per kind and language, so the first match is the only one.
export const sectionDocumentByKindQuery = q
  .parameters<TLocaleQueryParams & { kind: TSectionDocumentKind }>()
  .star.filterByType('page_privacyDocument', 'page_legalDocument')
  .filterBy('kind == $kind')
  .filterBy(`kind != "${LEGAL_PAGE_KIND.OTHER}"` as const)
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    _type: true,
    slug: sub.field('slug.current').notNull(),
  }))
  .nullable(true);
