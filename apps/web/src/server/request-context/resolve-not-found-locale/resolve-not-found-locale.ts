import type { TLocaleIsoCode, TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { REQUEST_CONTEXT_LOG } from '@web/constants/request-context';
import { routing } from '@web/i18n/routing';
import { selectTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { logger } from '@web/utils/logger/logger';
import { hasLocale } from 'next-intl';

const loadLiveLocales = async (
  row: TMaybeUndefined<TTenant>,
): Promise<readonly TLocaleIsoCode[]> => {
  if (!row) return routing.locales;
  try {
    return await selectTenantLiveLocales(row);
  } catch (error) {
    logger.error(REQUEST_CONTEXT_LOG.NOT_FOUND_LIVE_LOCALES_FAILED, { error });
    return routing.locales;
  }
};

export const resolveNotFoundLocale = async (
  row: TMaybeUndefined<TTenant>,
  locale: string,
): Promise<TLocaleIsoCode> => {
  const liveLocales = await loadLiveLocales(row);
  if (hasLocale(liveLocales, locale)) return locale;

  return row?.locale ?? routing.defaultLocale;
};
