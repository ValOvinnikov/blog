import type { TMaybeUndefined } from '@shinefold/config/types';
import { getTenantById } from '@shinefold/db/queries/tenants/get-tenant-by-id';
import {
  toTenantSanityTokenCredentials,
  type TTenantSanityTokenCredentials,
} from '@shinefold/db/queries/tenants/tenant-sanity-token-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TTenantSanityWriteCredentials = TTenantSanityTokenCredentials;

export function toTenantSanityWriteCredentials(
  tenant: TTenant,
): TMaybeUndefined<TTenantSanityWriteCredentials> {
  return toTenantSanityTokenCredentials(
    tenant,
    tenant.sanityWriteTokenEncrypted,
  );
}

export async function getTenantSanityWriteCredentials(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantSanityWriteCredentials>> {
  const tenant = await getTenantById(tenantId, { includeArchived: true });

  return tenant && toTenantSanityWriteCredentials(tenant);
}
