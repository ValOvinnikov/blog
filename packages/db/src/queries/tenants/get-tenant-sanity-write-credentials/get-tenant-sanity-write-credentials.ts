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

export type TTenantSanityWriteCredentials = {
  projectId: string;
  dataset: string;
  token: string;
  status: TTenantStatus;
  deprovisionedAt: TMaybeNull<Date>;
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>;
};

export function toTenantSanityWriteCredentials(
  tenant: TTenant,
): TMaybeUndefined<TTenantSanityWriteCredentials> {
  if (
    !tenant.sanityWriteTokenEncrypted ||
    !tenant.sanityProjectId ||
    !tenant.sanityDataset
  ) {
    return undefined;
  }

  return {
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    token: decryptSecret(
      tenant.sanityWriteTokenEncrypted,
      requireTenantTokenEncryptionKey(),
    ),
    status: tenant.status,
    deprovisionedAt: tenant.deprovisionedAt,
    provisioningStatus: tenant.provisioningStatus,
  };
}

export async function getTenantSanityWriteCredentials(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantSanityWriteCredentials>> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return tenant && toTenantSanityWriteCredentials(tenant);
}
