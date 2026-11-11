import type { TMaybeUndefined } from '@blog/config';
import { PREVIEW_TOKEN_QUERY_PARAM } from '@web/server/draft-preview/constants/constants';
import { readPreviewLinkClaims } from '@web/server/draft-preview/preview-token/preview-token';
import type { NextRequest } from 'next/server';

export const readVerifiedPreviewToken = (
  request: NextRequest,
  tenantId: TMaybeUndefined<string>,
): TMaybeUndefined<string> => {
  const { searchParams, pathname } = request.nextUrl;
  const token = searchParams.get(PREVIEW_TOKEN_QUERY_PARAM);
  if (!token || !tenantId) return undefined;

  const claims = readPreviewLinkClaims(token);
  return claims?.tenantId === tenantId && claims.path === pathname
    ? token
    : undefined;
};
