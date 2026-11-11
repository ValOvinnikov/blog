import {
  DRAFT_PREVIEW_MARKER,
  PREVIEW_TOKEN_QUERY_PARAM,
} from '@web/server/draft-preview/constants/constants';
import { NextResponse, type NextRequest } from 'next/server';

const toDraftPreviewPathname = (
  tenantId: string,
  localizedPathname: string,
): string => {
  const [, locale, ...rest] = localizedPathname.split('/');
  return [
    '',
    `${tenantId}${DRAFT_PREVIEW_MARKER}`,
    locale,
    DRAFT_PREVIEW_MARKER,
    ...rest,
  ].join('/');
};

export const prependTenantSegment = (
  intlResponse: NextResponse,
  tenantId: string,
  request: NextRequest,
  isDraftPreview = false,
): NextResponse => {
  if (!intlResponse.ok) {
    return intlResponse;
  }

  const rewriteTarget = intlResponse.headers.get('x-middleware-rewrite');
  const targetUrl = new URL(rewriteTarget ?? request.url);
  targetUrl.searchParams.delete(PREVIEW_TOKEN_QUERY_PARAM);
  targetUrl.pathname = isDraftPreview
    ? toDraftPreviewPathname(tenantId, targetUrl.pathname)
    : `/${tenantId}${targetUrl.pathname}`;

  return NextResponse.rewrite(targetUrl, { headers: intlResponse.headers });
};
