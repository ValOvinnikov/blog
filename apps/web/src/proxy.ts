import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { isTenantShapedPathSegment } from '@web/utils/is-tenant-shaped-path-segment';
import { logger } from '@web/utils/logger/logger';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { buildTenantRouting, localeForPrefix } from './i18n/routing';
import {
  resolveTenantRouting,
  type TTenantRouting,
} from './server/tenant/resolve-tenant-routing';
import { TENANT_ID_HEADER } from './server/tenant/tenant-id-header';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './server/tenant/unresolved-tenant-placeholder';
import { isProductionEnvironment } from './utils/is-production-environment';

const intlMiddlewares = new Map<string, ReturnType<typeof createMiddleware>>();

const getIntlMiddleware = (
  defaultLocale: TLocaleIsoCode,
  liveLocales: readonly TLocaleIsoCode[],
) => {
  const key = [defaultLocale, ...liveLocales].join(',');
  const cached = intlMiddlewares.get(key);
  if (cached) {
    return cached;
  }

  const middleware = createMiddleware(
    buildTenantRouting(defaultLocale, liveLocales),
  );
  intlMiddlewares.set(key, middleware);
  return middleware;
};

const SINGLE_DEFAULT_ROUTING = {
  defaultLocale: LOCALE_ISO_CODES.EN,
  liveLocales: [LOCALE_ISO_CODES.EN],
} as const;

// A prefix for a supported language the tenant doesn't serve (switched off
// by a downgrade) redirects to the same path in the default language.
const redirectSwitchedOffLocale = (
  request: NextRequest,
  firstSegment: string,
  liveLocales: readonly TLocaleIsoCode[],
): NextResponse | undefined => {
  const prefixedLocale = localeForPrefix(firstSegment);
  if (!prefixedLocale || liveLocales.includes(prefixedLocale)) {
    return undefined;
  }

  const target = request.nextUrl.clone();
  target.pathname =
    request.nextUrl.pathname.slice(firstSegment.length + 1) || '/';
  return NextResponse.redirect(target);
};

const DOTTED_PATH_PATTERN = /\./;

/**
 * Decodes only the first path segment, after splitting on `/` — decoding
 * the whole pathname first would let an encoded `%2f` forge a synthetic
 * separator. `undefined` means the segment couldn't be decoded, refused the
 * same as a tenant-shaped one: a segment we can't decode is one we can't
 * vouch for.
 */
const getDecodedFirstPathSegment = (pathname: string): string | undefined => {
  const raw = pathname.split('/').find((segment) => segment.length > 0) ?? '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
};

/**
 * Prepends the tenant segment to next-intl's own already-resolved rewrite
 * target (or the original request, when next-intl didn't need to rewrite),
 * forwarding every header its middleware pass set — including
 * `X-NEXT-INTL-LOCALE` — rather than re-deriving them.
 */
const prependTenantSegment = (
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

/**
 * Refuses any request whose first path segment is already tenant-shaped,
 * then passes root-level dotted paths (sitemap.xml, robots.txt, rss.xml,
 * favicon.ico, per-tag rss feeds) through unrewritten. Only past both
 * checks does it resolve the tenant from the request's `Host` header and
 * hand off to next-intl's own middleware, mutating `request.headers` in
 * place (rather than building a fresh `NextResponse.next({request:{headers}})`)
 * so next-intl's own internal request-header clone — built from this same
 * `request` object — carries `TENANT_ID_HEADER` through to whatever
 * response (rewrite/redirect) it produces; the dotted-path branch above has
 * no next-intl clone to ride along on, so it forwards the mutated headers
 * explicitly instead.
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
  const { pathname } = request.nextUrl;
  const firstSegment = getDecodedFirstPathSegment(pathname);

  if (firstSegment === undefined || isTenantShapedPathSegment(firstSegment)) {
    return new NextResponse(null, { status: 404 });
  }

  if (DOTTED_PATH_PATTERN.test(pathname)) {
    request.headers.delete(TENANT_ID_HEADER);
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const host = request.headers.get('host');

  let tenantRouting: TTenantRouting | undefined;
  try {
    tenantRouting = await resolveTenantRouting(host);
  } catch (error) {
    logger.error('proxy.tenant_lookup_failed', { host, error });
    return new NextResponse(null, { status: 503 });
  }

  const tenantId = tenantRouting?.tenantId;

  if (!tenantId && isProductionEnvironment()) {
    return new NextResponse(null, { status: 404 });
  }

  request.headers.delete(TENANT_ID_HEADER);
  if (tenantId) {
    request.headers.set(TENANT_ID_HEADER, tenantId);
  }

  const { defaultLocale, liveLocales } =
    tenantRouting ?? SINGLE_DEFAULT_ROUTING;

  const switchedOffRedirect = redirectSwitchedOffLocale(
    request,
    firstSegment,
    liveLocales,
  );
  if (switchedOffRedirect) {
    return switchedOffRedirect;
  }

  const intlResponse = getIntlMiddleware(defaultLocale, liveLocales)(request);

  return prependTenantSegment(
    intlResponse,
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
    request,
  );
}

export const config = {
  matcher: '/((?!api|_next|_vercel|icon|\\.well-known).*)',
};
