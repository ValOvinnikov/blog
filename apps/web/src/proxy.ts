import { HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { PROXY_LOG } from '@web/constants/proxy';
import { SINGLE_LANGUAGE_ROUTING } from '@web/i18n/routing';
import { applyPreviewResponseHeaders } from '@web/server/draft-preview/apply-preview-response-headers/apply-preview-response-headers';
import { PREVIEW_TOKEN_HEADER } from '@web/server/draft-preview/constants/constants';
import { getIntlMiddleware } from '@web/server/proxy/get-intl-middleware/get-intl-middleware';
import { prependTenantSegment } from '@web/server/proxy/prepend-tenant-segment/prepend-tenant-segment';
import { redirectSwitchedOffLocale } from '@web/server/proxy/redirect-switched-off-locale/redirect-switched-off-locale';
import { redirectToPreferredTranslation } from '@web/server/proxy/redirect-to-preferred-translation/redirect-to-preferred-translation';
import { setRoutingRequestHeaders } from '@web/server/proxy/set-routing-request-headers/set-routing-request-headers';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import { operatorSuspendedPage } from '@web/server/tenant/operator-suspension/operator-suspended-page';
import { isOperatorSuspended } from '@web/server/tenant/operator-suspension/operator-suspension';
import { passThroughUnlessOperatorSuspended } from '@web/server/tenant/operator-suspension/pass-through-unless-operator-suspended';
import { isSuspensionExemptPagePath } from '@web/server/tenant/operator-suspension/suspension-exempt-page-path';
import {
  resolveTenantRouting,
  type TTenantRouting,
} from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { getDecodedFirstPathSegment } from '@web/utils/get-decoded-first-path-segment';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { isTenantShapedPathSegment } from '@web/utils/is-tenant-shaped-path-segment';
import { logger } from '@web/utils/logger/logger';
import { siteUnavailableStatus } from '@web/utils/site-unavailable-response';
import { NextResponse, type NextRequest } from 'next/server';

const DOTTED_PATH_PATTERN = /\./;
const FEED_PATH_PATTERN = /\/rss\.xml$/;
const SUSPENSION_GATED_PATH_PATTERN = /^\/(?:api\/|sitemap\.xml$)/;

const routeRequest = async (request: NextRequest): Promise<NextResponse> => {
  const { pathname } = request.nextUrl;
  const firstSegment = getDecodedFirstPathSegment(pathname);

  if (isUndefined(firstSegment) || isTenantShapedPathSegment(firstSegment)) {
    return new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });
  }

  if (SUSPENSION_GATED_PATH_PATTERN.test(pathname)) {
    return passThroughUnlessOperatorSuspended(request);
  }

  if (DOTTED_PATH_PATTERN.test(pathname) && !FEED_PATH_PATTERN.test(pathname)) {
    request.headers.delete(TENANT_ID_HEADER);
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const host = request.headers.get('host');

  let tenantRouting: TMaybeUndefined<TTenantRouting>;
  try {
    tenantRouting = await resolveTenantRouting(host);
  } catch (error) {
    logger.error(PROXY_LOG.TENANT_LOOKUP_FAILED, { host, error });
    // Fail closed: a thrown lookup must never fall through to a default tenant.
    return new NextResponse(null, { status: HTTP_STATUS.SERVICE_UNAVAILABLE });
  }

  if (
    tenantRouting &&
    isOperatorSuspended(tenantRouting.tenant) &&
    !isSuspensionExemptPagePath(pathname, firstSegment)
  ) {
    return FEED_PATH_PATTERN.test(pathname)
      ? siteUnavailableStatus()
      : operatorSuspendedPage(firstSegment, tenantRouting);
  }

  const tenantId = tenantRouting?.tenantId;

  if (!tenantId && isProductionEnvironment()) {
    return new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });
  }

  const isDraftPreview = setRoutingRequestHeaders(request, tenantId);

  const { defaultLocale, liveLocales } =
    tenantRouting ?? SINGLE_LANGUAGE_ROUTING;

  const switchedOffRedirect = redirectSwitchedOffLocale(
    request,
    firstSegment,
    liveLocales,
  );
  if (switchedOffRedirect) {
    return switchedOffRedirect;
  }

  const translationRedirect = await redirectToPreferredTranslation(
    request,
    firstSegment,
    tenantRouting,
  );
  if (translationRedirect) {
    return translationRedirect;
  }

  const intlResponse = getIntlMiddleware(defaultLocale, liveLocales)(request);

  return prependTenantSegment(
    intlResponse,
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
    request,
    isDraftPreview,
  );
};

export default async function proxy(
  request: NextRequest,
): Promise<NextResponse> {
  request.headers.delete(PREVIEW_TOKEN_HEADER);
  return applyPreviewResponseHeaders(request, await routeRequest(request));
}

export const config = {
  // The UUID is BotID's fixed path prefix, which the tenant-shaped guard would otherwise 404.
  // A dotted final segment skips the proxy unless it is a feed, or the `.rsc` suffix Next matches RSC requests with.
  // The middle entries reach the proxy only so an operator-suspended site can answer them with 503; newsletter unsubscribe, sign-in and account export stay reachable.
  // The last sends every request carrying a preview token here, so none escapes the framing headers `next.config` leaves to the proxy; Next requires its key as a literal, not `PREVIEW_TOKEN_QUERY_PARAM`.
  matcher: [
    '/((?!api|_next|_vercel|icon|\\.well-known|149e9513-01fa-4fb0-aad4-566afd725d1b|(?:.*/)?(?!rss\\.xml$|[^/]*\\.rsc$)[^/]*\\.[^/]*$).*)',
    '/sitemap.xml',
    '/api/newsletter/confirm',
    '/api/switch-language',
    '/api/generate-skim',
    { source: '/:path*', has: [{ type: 'query', key: 'preview' }] },
  ],
};
