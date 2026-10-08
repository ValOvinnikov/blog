import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

/** The link's language is visitor-supplied, so it only ever chooses among the tenant's own languages. */
export const resolveNewsletterLinkLocale = async (
  lang: string | null,
): Promise<TLocaleIsoCode> => {
  try {
    const tenant = await resolveRequestTenant();
    if (!tenant) return routing.defaultLocale;

    const liveLocales = queries.tenants.selectLiveLocales(tenant);
    return lang && isLocaleIsoCode(lang) && liveLocales.includes(lang)
      ? lang
      : tenant.locale;
  } catch (error) {
    logger.warn('newsletter.link_locale_tenant_lookup_failed', { error });
    return routing.defaultLocale;
  }
};
