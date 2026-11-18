import type { TLocaleIsoCode, TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { routing } from '@web/i18n/routing';
import { resolveTenantPlanEntitlements } from '@web/server/tenant/tenant-entitlements/tenant-entitlements';

export const selectTenantLiveLocales = async (
  tenant: Pick<TTenant, 'id' | 'locale' | 'additionalLocales' | 'plan'>,
): Promise<TLocaleIsoCode[]> => {
  const { id, plan } = tenant;
  return queries.tenants.selectLiveLocalesWithin(
    tenant,
    await resolveTenantPlanEntitlements(id, plan),
  );
};

export const getTenantLiveLocales = async (
  tenantId: string,
): Promise<TMaybeUndefined<TLocaleIsoCode[]>> => {
  const locales = await queries.tenants.getTenantLocales(tenantId);
  if (!locales) return undefined;

  const { defaultLocale, additionalLocales, plan } = locales;
  return selectTenantLiveLocales({
    id: tenantId,
    locale: defaultLocale,
    additionalLocales,
    plan,
  });
};

export const resolveTenantLiveLocales = async (
  tenantId: string,
): Promise<TResult<TLocaleIsoCode[]>> => {
  try {
    const locales = await getTenantLiveLocales(tenantId);
    return okResult(locales ?? [routing.defaultLocale]);
  } catch (error) {
    return errorResult(error);
  }
};
