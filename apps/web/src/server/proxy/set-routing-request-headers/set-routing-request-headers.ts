import type { TMaybeUndefined } from '@blog/config';
import { PREVIEW_TOKEN_HEADER } from '@web/server/draft-preview/constants/constants';
import { readVerifiedPreviewToken } from '@web/server/draft-preview/read-verified-preview-token/read-verified-preview-token';
import { TENANT_ID_HEADER } from '@web/server/tenant/constants/constants';
import type { NextRequest } from 'next/server';

/** Returns whether the request carries a verified preview token for its tenant and path. */
export const setRoutingRequestHeaders = (
  request: NextRequest,
  tenantId: TMaybeUndefined<string>,
): boolean => {
  // Delete before setting, so a client-forged `x-tenant-id` never survives an unresolved tenant.
  request.headers.delete(TENANT_ID_HEADER);
  if (tenantId) {
    request.headers.set(TENANT_ID_HEADER, tenantId);
  }

  const previewToken = readVerifiedPreviewToken(request, tenantId);
  if (previewToken) {
    request.headers.set(PREVIEW_TOKEN_HEADER, previewToken);
  }
  return Boolean(previewToken);
};
