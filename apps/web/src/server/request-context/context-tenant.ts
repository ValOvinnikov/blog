import type { TCapability, TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { isTenantServable } from '@web/server/tenant/is-tenant-servable';
import { env } from '@web/utils/env/env';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getContextLocale, getContextTenantId } from './request-context';

export type TContextTenantLocales = {
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
};

// Archived and deprovisioned rows included: credentials and locales never
// filtered on them, and the base URL applies its own servability gate.
const getContextTenantRow = cache(async () => {
  const tenantId = getContextTenantId();
  if (!tenantId || !isValidTenantId(tenantId)) return undefined;

  return queries.tenants.getTenantById(tenantId, { includeArchived: true });
});

const getContextTenantCredentials = cache(
  async (): Promise<TTenantSanityContext> => {
    if (!getContextTenantId()) return getPlatformSanityContext();

    const row = await getContextTenantRow();
    const credentials = row && queries.tenants.toTenantSanityCredentials(row);
    if (credentials) return credentials;

    if (isProductionEnvironment()) {
      notFound();
    }
    return getPlatformSanityContext();
  },
);

export const getContextSanityContext = cache(
  async (): Promise<TTenantSanityContext> => ({
    ...(await getContextTenantCredentials()),
    locale: getContextLocale(),
  }),
);

export const getContextBaseUrl = cache(
  async (): Promise<string | undefined> => {
    const row = await getContextTenantRow();
    const isServable = row && !row.deprovisionedAt && isTenantServable(row);

    return isServable && row.primaryDomain
      ? `https://${row.primaryDomain}`
      : env.NEXT_PUBLIC_SITE_URL;
  },
);

export const getContextTenantLocales = cache(
  async (): Promise<TContextTenantLocales | undefined> => {
    const row = await getContextTenantRow();
    if (!row) return undefined;

    return {
      defaultLocale: row.locale,
      liveLocales: queries.tenants.selectLiveLocales(row),
    };
  },
);

export const isContextCapabilityEnabled = cache(
  async (capability: TCapability): Promise<boolean> => {
    const tenantId = getContextTenantId();
    return tenantId ? isCapabilityEnabled(capability, tenantId) : false;
  },
);
