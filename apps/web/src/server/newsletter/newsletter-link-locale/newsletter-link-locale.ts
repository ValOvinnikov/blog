import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
  type TMaybeNull,
} from '@shinefold/config';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { selectTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { logger } from '@web/utils/logger/logger';

export type TNewsletterLinkLocale = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

const FALLBACK_LINK_LOCALE: TNewsletterLinkLocale = {
  locale: routing.defaultLocale,
  defaultLocale: routing.defaultLocale,
};

/** The link's language is visitor-supplied, so it only ever chooses among the tenant's own languages. */
export const resolveNewsletterLinkLocale = async (
  lang: TMaybeNull<string>,
): Promise<TNewsletterLinkLocale> => {
  try {
    const tenant = await resolveRequestTenant();
    if (!tenant) return FALLBACK_LINK_LOCALE;

    const { locale: defaultLocale } = tenant;
    const liveLocales = await selectTenantLiveLocales(tenant);
    const locale =
      lang && isLocaleIsoCode(lang) && liveLocales.includes(lang)
        ? lang
        : defaultLocale;
    return { locale, defaultLocale };
  } catch (error) {
    logger.warn(NEWSLETTER_LOG.LINK_LOCALE_TENANT_LOOKUP_FAILED, { error });
    return FALLBACK_LINK_LOCALE;
  }
};
