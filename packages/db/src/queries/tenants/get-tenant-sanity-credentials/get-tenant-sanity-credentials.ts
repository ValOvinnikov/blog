import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getTenantById } from '@shinefold/db/queries/tenants/get-tenant-by-id';
import {
  toTenantSanityTokenCredentials,
  type TTenantSanityTokenCredentials,
} from '@shinefold/db/queries/tenants/tenant-sanity-token-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TTenantSanityCredentials = TTenantSanityTokenCredentials & {
  defaultLocale: TLocaleIsoCode;
};

export function toTenantSanityCredentials(
  tenant: TTenant,
): TMaybeUndefined<TTenantSanityCredentials> {
  const credentials = toTenantSanityTokenCredentials(
    tenant,
    tenant.sanityReadTokenEncrypted,
  );

  return credentials && { ...credentials, defaultLocale: tenant.locale };
}

/**
 * Resolves a tenant's Sanity read credentials alongside its servable state, without gating on it, so callers must check that state before serving.
 */
export async function getTenantSanityCredentials(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantSanityCredentials>> {
  const tenant = await getTenantById(tenantId, { includeArchived: true });

  return tenant && toTenantSanityCredentials(tenant);
}
