import type { TLocaleIsoCode } from '@shinefold/config';
import { getTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';

export const isLiveLocale = async (
  tenantId: string,
  locale: TLocaleIsoCode,
): Promise<boolean> => {
  const liveLocales = await getTenantLiveLocales(tenantId);
  return liveLocales?.includes(locale) ?? false;
};
