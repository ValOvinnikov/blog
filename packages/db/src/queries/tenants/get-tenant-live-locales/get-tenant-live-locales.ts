import type { TMaybeUndefined } from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { PLAN_LOCALE_LIMIT } from '@shinefold/db/constants';
import { getTenantLocales } from '@shinefold/db/queries/tenants/get-tenant-locales';
import type { TTenant } from '@shinefold/db/schema/tenants';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export function selectLiveLocalesWithin(
  { locale, additionalLocales }: Pick<TTenant, 'locale' | 'additionalLocales'>,
  { localeLimit }: Pick<TTenantEntitlements, 'localeLimit'>,
): TLocaleIsoCode[] {
  return [locale, ...additionalLocales.slice(0, localeLimit - 1)];
}

export function selectLiveLocales({
  plan,
  ...tenant
}: Pick<TTenant, 'locale' | 'additionalLocales' | 'plan'>): TLocaleIsoCode[] {
  return selectLiveLocalesWithin(tenant, {
    localeLimit: PLAN_LOCALE_LIMIT[plan],
  });
}

export async function getTenantLiveLocales(
  tenantId: string,
): Promise<TMaybeUndefined<TLocaleIsoCode[]>> {
  const locales = await getTenantLocales(tenantId);

  if (!locales) {
    return undefined;
  }

  const { defaultLocale, additionalLocales, plan } = locales;

  return selectLiveLocales({ locale: defaultLocale, additionalLocales, plan });
}
