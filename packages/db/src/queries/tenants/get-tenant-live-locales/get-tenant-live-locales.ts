import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export function selectLiveLocalesWithin(
  { locale, additionalLocales }: Pick<TTenant, 'locale' | 'additionalLocales'>,
  { localeLimit }: Pick<TTenantEntitlements, 'localeLimit'>,
): TLocaleIsoCode[] {
  return [locale, ...additionalLocales.slice(0, localeLimit - 1)];
}
