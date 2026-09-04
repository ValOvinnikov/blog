import { logger } from '@web/utils/logger/logger';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';
import { resolveTenantId } from './server/tenant/resolve-tenant-id';
import { TENANT_ID_HEADER } from './server/tenant/tenant-id-header';
import { isProductionEnvironment } from './utils/is-production-environment';

const handleI18nRouting = createMiddleware(routing);

/**
 * Resolves the tenant from the request's `Host` header before handing off
 * to next-intl's own middleware, and mutates `request.headers` in place
 * (rather than building a fresh `NextResponse.next({request:{headers}})`)
 * so next-intl's own internal request-header clone — which it builds from
 * this same `request` object — carries `TENANT_ID_HEADER` through to
 * whatever response (rewrite/redirect) it produces.
 *
 * `TENANT_ID_HEADER` is always deleted first, before the conditional `.set`
 * — a client-supplied `x-tenant-id` on the incoming request must never
 * survive resolution failing (0 or 2+ tenant rows outside production, or an
 * unmatched host that already 404'd in production), or it would be forwarded
 * verbatim to every downstream reader of this header as a spoofed tenant.
 *
 * A thrown lookup (Neon unreachable, credentials rotated, …) is distinct
 * from an ordinary unmatched host: it is caught, logged once, and fails
 * closed with a 503 before next-intl or any route handler runs, rather than
 * falling through to any default or previously-resolved tenant.
 */
export default async function proxy(
  request: NextRequest,
): Promise<NextResponse> {
  const host = request.headers.get('host');

  let tenantId: string | undefined;
  try {
    tenantId = await resolveTenantId(host);
  } catch (error) {
    logger.error('proxy.tenant_lookup_failed', { host, error });
    return new NextResponse(null, { status: 503 });
  }

  if (!tenantId && isProductionEnvironment()) {
    return new NextResponse(null, { status: 404 });
  }

  request.headers.delete(TENANT_ID_HEADER);
  if (tenantId) {
    request.headers.set(TENANT_ID_HEADER, tenantId);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher:
    '/((?!api|_next|_vercel|icon|opengraph-image|twitter-image|.*\\..*).*)',
};
