import type { TMaybeUndefined } from '@blog/config';
import { PREVIEW_TOKEN_HEADER } from '@web/server/draft-preview/constants/constants';
import { TENANT_ID_HEADER } from '@web/server/tenant/constants/constants';
import type { NextRequest } from 'next/server';

export const setRoutingRequestHeaders = (
  request: NextRequest,
  tenantId: TMaybeUndefined<string>,
  verifiedPreviewToken: TMaybeUndefined<string>,
): void => {
  // Delete before setting, so a client-forged `x-tenant-id` never survives an unresolved tenant.
  request.headers.delete(TENANT_ID_HEADER);
  if (tenantId) {
    request.headers.set(TENANT_ID_HEADER, tenantId);
  }

  if (verifiedPreviewToken) {
    request.headers.set(PREVIEW_TOKEN_HEADER, verifiedPreviewToken);
  }
};
