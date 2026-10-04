import { queries } from '@blog/db';
import { SINGLE_LANGUAGE_ROUTING } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isPlatformFallbackAllowed } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { getTenantTranslationMap } from '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map';
import { rememberLanguage } from '@web/utils/language-cookie';
import { parseSwitchLanguageRequest } from '@web/utils/parse-switch-language-request';
import { privateRedirect } from '@web/utils/private-redirect';
import { toSwitchLanguageTarget } from '@web/utils/to-switch-language-target';
import { NextResponse, type NextRequest } from 'next/server';

const EMPTY_TRANSLATION_MAP = { groups: [] };

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tenant = await resolveRequestTenant();
  if (!tenant && !isPlatformFallbackAllowed()) {
    return new NextResponse(null, { status: 404 });
  }

  const { defaultLocale, liveLocales } = tenant
    ? {
        defaultLocale: tenant.locale,
        liveLocales: queries.tenants.selectLiveLocales(tenant),
      }
    : SINGLE_LANGUAGE_ROUTING;
  const switchRequest = parseSwitchLanguageRequest(
    request.nextUrl.searchParams,
    liveLocales,
  );
  if (!switchRequest) {
    return new NextResponse(null, { status: 400 });
  }

  const { to, from } = switchRequest;
  const translationMap =
    (tenant &&
      liveLocales.length > 1 &&
      (await getTenantTranslationMap(tenant))) ||
    EMPTY_TRANSLATION_MAP;
  const target = request.nextUrl.clone();
  target.pathname = toSwitchLanguageTarget({
    translationMap,
    from,
    to,
    defaultLocale,
    liveLocales,
  });
  target.search = '';

  const response = privateRedirect(target);
  rememberLanguage(response.cookies, to);
  return response;
}
