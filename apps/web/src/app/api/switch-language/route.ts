import { HTTP_STATUS } from '@shinefold/config/constants';
import { hasArrayGotMultipleItems } from '@shinefold/utils/primitives';
import { SINGLE_LANGUAGE_ROUTING } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { selectTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { getTenantTranslationMap } from '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map';
import { isPlatformFallbackHost } from '@web/utils/is-platform-fallback-host';
import { rememberLanguage } from '@web/utils/language-cookie';
import { parseSwitchLanguageRequest } from '@web/utils/parse-switch-language-request';
import { privateRedirect } from '@web/utils/private-redirect';
import { toSwitchLanguageTarget } from '@web/utils/to-switch-language-target';
import { NextResponse, type NextRequest } from 'next/server';

const EMPTY_TRANSLATION_MAP = {
  groups: [],
  homeLanguages: [],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
  privacyIndexLanguages: [],
  legalIndexLanguages: [],
  cookieStatementLanguages: [],
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tenant = await resolveRequestTenant();
  if (!tenant && !isPlatformFallbackHost(request.headers.get('host'))) {
    return new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });
  }

  const { defaultLocale, liveLocales } = tenant
    ? {
        defaultLocale: tenant.locale,
        liveLocales: await selectTenantLiveLocales(tenant),
      }
    : SINGLE_LANGUAGE_ROUTING;
  const switchRequest = parseSwitchLanguageRequest(
    request.nextUrl.searchParams,
    liveLocales,
  );
  if (!switchRequest) {
    return new NextResponse(null, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const { to, from } = switchRequest;
  const translationMap =
    (tenant &&
      hasArrayGotMultipleItems(liveLocales) &&
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
