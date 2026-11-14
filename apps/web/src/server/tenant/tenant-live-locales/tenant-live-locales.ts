import type { TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { routing } from '@web/i18n/routing';

export const resolveTenantLiveLocales = async (
  tenantId: string,
): Promise<TResult<TLocaleIsoCode[]>> => {
  try {
    const locales = await queries.tenants.getTenantLiveLocales(tenantId);
    return okResult(locales ?? [routing.defaultLocale]);
  } catch (error) {
    return errorResult(error);
  }
};
