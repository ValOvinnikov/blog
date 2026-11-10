import { NextResponse, type NextRequest } from 'next/server';

export const prependTenantSegment = (
  intlResponse: NextResponse,
  tenantId: string,
  request: NextRequest,
): NextResponse => {
  if (!intlResponse.ok) {
    return intlResponse;
  }

  const rewriteTarget = intlResponse.headers.get('x-middleware-rewrite');
  const targetUrl = new URL(rewriteTarget ?? request.url);
  targetUrl.pathname = `/${tenantId}${targetUrl.pathname}`;

  return NextResponse.rewrite(targetUrl, { headers: intlResponse.headers });
};
