import type { TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';

export const isLiveLocale = async (
  tenantId: string,
  locale: TLocaleIsoCode,
): Promise<boolean> => {
  const liveLocales = await queries.tenants.getTenantLiveLocales(tenantId);
  return liveLocales?.includes(locale) ?? false;
};
