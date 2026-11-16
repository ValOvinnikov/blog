import type { TLocaleIsoCode } from '@shinefold/config';
import { queries } from '@shinefold/db';

export const isLiveLocale = async (
  tenantId: string,
  locale: TLocaleIsoCode,
): Promise<boolean> => {
  const liveLocales = await queries.tenants.getTenantLiveLocales(tenantId);
  return liveLocales?.includes(locale) ?? false;
};
