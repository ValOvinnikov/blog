import type { TLocaleIsoCode } from '@blog/config';
import { buildTenantRouting } from '@web/i18n/routing';
import createMiddleware from 'next-intl/middleware';

const intlMiddlewares = new Map<string, ReturnType<typeof createMiddleware>>();

export const getIntlMiddleware = (
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
