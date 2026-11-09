import { LEGAL_PAGE_KIND } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { z } from 'zod';

import type { TSectionDocumentKind } from './types';

const IS_SECTION_DOCUMENT_OF_KIND = `(_type in ["page_privacyDocument", "page_legalDocument"] && kind == $kind && kind != "${LEGAL_PAGE_KIND.OTHER}")`;
const IS_COOKIE_STATEMENT_OF_KIND = `(_type == "page_cookieStatement" && $kind == "${LEGAL_PAGE_KIND.COOKIE_STATEMENT}")`;

// Studio validation allows one published page per kind and language, so the first match is the only one.
export const sectionDocumentByKindQuery = q
  .parameters<TLocaleQueryParams & { kind: TSectionDocumentKind }>()
  .star.filterByType(
    'page_privacyDocument',
    'page_legalDocument',
    'page_cookieStatement',
  )
  .filterRaw(`${IS_SECTION_DOCUMENT_OF_KIND} || ${IS_COOKIE_STATEMENT_OF_KIND}`)
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    _type: true,
    slug: sub.raw('slug.current', z.string().nullable()),
  }))
  .nullable(true);
