import type { TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';

import { resolveTenant } from './resolve-tenant';

export type TTenantRouting = {
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
};

export const resolveTenantRouting = async (
  host: string | null,
): Promise<TTenantRouting | undefined> => {
  const tenant = await resolveTenant(host);

  if (!tenant) {
    return undefined;
  }

  return {
    tenantId: tenant.id,
    defaultLocale: tenant.locale,
    liveLocales: queries.tenants.selectLiveLocales(tenant),
  };
};
