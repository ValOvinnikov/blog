import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type {
  TTenantProvisioningStatus,
  TTenantStatus,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { decryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantSanityCredentials = {
  projectId: string;
  dataset: string;
  token: string;
  defaultLocale: TLocaleIsoCode;
  status: TTenantStatus;
  deprovisionedAt: TMaybeNull<Date>;
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>;
};

export function toTenantSanityCredentials(
  tenant: TTenant,
): TMaybeUndefined<TTenantSanityCredentials> {
  if (
    !tenant.sanityReadTokenEncrypted ||
    !tenant.sanityProjectId ||
    !tenant.sanityDataset
  ) {
    return undefined;
  }

  return {
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    token: decryptSecret(
      tenant.sanityReadTokenEncrypted,
      requireTenantTokenEncryptionKey(),
    ),
    defaultLocale: tenant.locale,
    status: tenant.status,
    deprovisionedAt: tenant.deprovisionedAt,
    provisioningStatus: tenant.provisioningStatus,
  };
}

/**
 * Resolves a tenant's Sanity read credentials alongside its servable
 * state (`status`, `deprovisionedAt`, `provisioningStatus`) — this does not
 * itself gate on that state, so callers must check it before serving.
 */
export async function getTenantSanityCredentials(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantSanityCredentials>> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return tenant && toTenantSanityCredentials(tenant);
}
