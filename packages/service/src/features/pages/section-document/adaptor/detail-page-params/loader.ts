import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';
import type { TSectionDocumentType } from '@shinefold/service/shared/types/page/section-document-type';

import { sectionDocumentParamsQuery } from './query';

export async function getSectionDocumentParams(
  type: TSectionDocumentType,
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<{ slug: string; language: TLocaleIsoCode }[]> {
  return runQuery(sectionDocumentParamsQuery, {
    parameters: { type, locales },
    tenant,
    ...isr(['page_privacyDocument', 'page_legalDocument'], tenant.projectId),
  });
}
