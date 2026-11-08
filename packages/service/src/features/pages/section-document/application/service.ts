import { getSectionDocumentByKind } from '@blog/service/features/pages/section-document/adaptor/by-kind/loader';
import type { TSectionDocumentKind } from '@blog/service/features/pages/section-document/adaptor/by-kind/types';
import { getSectionDocument } from '@blog/service/features/pages/section-document/adaptor/detail-page/loader';
import { getSectionDocumentParams } from '@blog/service/features/pages/section-document/adaptor/detail-page-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';
import type { TSectionDocumentType } from '@blog/service/shared/types/page/section-document-type';
import { safeAsync } from '@blog/utils';

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
