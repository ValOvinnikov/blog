import type { TLocaleIsoCode } from '@blog/config/constants';
import { PLAN_LOCALE_LIMIT } from '@blog/db/constants';
import { getTenantLocales } from '@blog/db/queries/tenants/get-tenant-locales';
import type { TTenant } from '@blog/db/schema/tenants';

export function selectLiveLocales({
  locale,
  additionalLocales,
  plan,
}: Pick<TTenant, 'locale' | 'additionalLocales' | 'plan'>): TLocaleIsoCode[] {
  return [locale, ...additionalLocales.slice(0, PLAN_LOCALE_LIMIT[plan] - 1)];
}

export async function getTenantLiveLocales(
  tenantId: string,
): Promise<TLocaleIsoCode[] | undefined> {
  const locales = await getTenantLocales(tenantId);

  if (!locales) {
    return undefined;
  }

  const { defaultLocale, additionalLocales, plan } = locales;

  return selectLiveLocales({ locale: defaultLocale, additionalLocales, plan });
}
