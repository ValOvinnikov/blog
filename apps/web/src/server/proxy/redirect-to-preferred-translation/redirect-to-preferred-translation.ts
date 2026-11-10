import { HTTP_METHOD, type TMaybeUndefined } from '@blog/config';
import { localeForPrefix } from '@web/i18n/routing';
import type { TTenantRouting } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { getTenantTranslationMap } from '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map';
import { findTranslatedPath } from '@web/utils/find-translated-path';
import { isCrawler } from '@web/utils/is-crawler';
import { readRememberedLanguage } from '@web/utils/language-cookie';
import { matchAcceptLanguage } from '@web/utils/match-accept-language';
import { privateRedirect } from '@web/utils/private-redirect';
import type { NextRequest, NextResponse } from 'next/server';

const DETECTABLE_METHODS = new Set<string>([HTTP_METHOD.GET, HTTP_METHOD.HEAD]);

export const redirectToPreferredTranslation = async (
  request: NextRequest,
  firstSegment: string,
  tenantRouting: TMaybeUndefined<TTenantRouting>,
): Promise<TMaybeUndefined<NextResponse>> => {
  if (
    !tenantRouting ||
    tenantRouting.liveLocales.length < 2 ||
    !DETECTABLE_METHODS.has(request.method) ||
    localeForPrefix(firstSegment) ||
    isCrawler(request.headers.get('user-agent'))
  ) {
    return undefined;
  }

  const { tenant, defaultLocale, liveLocales } = tenantRouting;
  const preferredLocale =
    readRememberedLanguage(request.cookies, liveLocales) ??
    matchAcceptLanguage(request.headers.get('accept-language'), liveLocales);
  if (!preferredLocale || preferredLocale === defaultLocale) {
    return undefined;
  }

  const translationMap = await getTenantTranslationMap(tenant);
  const translatedPath =
    translationMap &&
    findTranslatedPath({
      translationMap,
      pathname: request.nextUrl.pathname,
      fromLocale: defaultLocale,
      toLocale: preferredLocale,
      defaultLocale,
    });
  if (!translatedPath) {
    return undefined;
  }

  const target = request.nextUrl.clone();
  target.pathname = translatedPath;
  return privateRedirect(target);
};
