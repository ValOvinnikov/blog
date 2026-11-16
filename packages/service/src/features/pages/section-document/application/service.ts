import { getSectionDocumentByKind } from '@shinefold/service/features/pages/section-document/adaptor/by-kind/loader';
import type { TSectionDocumentKind } from '@shinefold/service/features/pages/section-document/adaptor/by-kind/types';
import { getSectionDocument } from '@shinefold/service/features/pages/section-document/adaptor/detail-page/loader';
import { getSectionDocumentParams } from '@shinefold/service/features/pages/section-document/adaptor/detail-page-params/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';
import type { TSectionDocumentType } from '@shinefold/service/shared/types/page/section-document-type';
import { safeAsync } from '@shinefold/utils';

export function createSectionDocumentService() {
  return {
    v1: {
      getSectionDocument: safeAsync(
        (
          type: TSectionDocumentType,
          slug: string,
          tenant: TTenantSanityContext,
        ) => getSectionDocument(type, slug, tenant),
      ),
      getSectionDocumentParams: safeAsync(
        (
          type: TSectionDocumentType,
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) => getSectionDocumentParams(type, tenant, locales),
      ),
      getSectionDocumentByKind: safeAsync(
        (kind: TSectionDocumentKind, tenant: TTenantSanityContext) =>
          getSectionDocumentByKind(kind, tenant),
      ),
    },
  };
}
