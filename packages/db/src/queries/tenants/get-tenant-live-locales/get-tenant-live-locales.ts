import type { TLocaleIsoCode } from '@blog/config/constants';
import { PLAN_LOCALE_LIMIT } from '@blog/db/constants';
import { getTenantLocales } from '@blog/db/queries/tenants/get-tenant-locales';

export async function getTenantLiveLocales(
  tenantId: string,
): Promise<TLocaleIsoCode[] | undefined> {
  const locales = await getTenantLocales(tenantId);

  if (!locales) {
    return undefined;
  }

  const { defaultLocale, additionalLocales, plan } = locales;

  return [
    defaultLocale,
    ...additionalLocales.slice(0, PLAN_LOCALE_LIMIT[plan] - 1),
  ];
}
