import { HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import type { TTenantRouting } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { NextResponse, type NextRequest } from 'next/server';

export const redirectToMainAddress = (
  request: NextRequest,
  tenantRouting: TMaybeUndefined<TTenantRouting>,
): TMaybeUndefined<NextResponse> => {
  if (!tenantRouting?.isSecondaryHost) return undefined;

  const target = request.nextUrl.clone();
  target.hostname = tenantRouting.tenant.primaryDomain;
  target.port = '';
  return NextResponse.redirect(target, HTTP_STATUS.MOVED_PERMANENTLY);
};
