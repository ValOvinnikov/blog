import type { TMaybeUndefined } from '@blog/config/types';
import { getTenantById } from '@blog/db/queries/tenants/get-tenant-by-id';
import {
  toTenantSanityTokenCredentials,
  type TTenantSanityTokenCredentials,
} from '@blog/db/queries/tenants/tenant-sanity-token-credentials';
import type { TTenant } from '@blog/db/schema/tenants';

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
