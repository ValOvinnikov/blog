import { getDb } from '@blog/db/client';
import type {
  TTenantProvisioningStatus,
  TTenantStatus,
} from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { env } from '@blog/db/utils/env/env';
import { decryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantSanityWriteCredentials = {
  projectId: string;
  dataset: string;
  token: string;
  status: TTenantStatus;
  deprovisionedAt: Date | null;
  provisioningStatus: TTenantProvisioningStatus | null;
};

/**
 * Resolves a tenant's Sanity write credentials alongside its servable
 * state (`status`, `deprovisionedAt`, `provisioningStatus`) — this does not
 * itself gate on that state, so callers must check it before writing.
 */
export async function getTenantSanityWriteCredentials(
  tenantId: string,
): Promise<TTenantSanityWriteCredentials | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (
    !tenant?.sanityWriteTokenEncrypted ||
    !tenant.sanityProjectId ||
    !tenant.sanityDataset
  ) {
    return undefined;
  }

  if (!env.TENANT_TOKEN_ENCRYPTION_KEY) {
    throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  return {
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    token: decryptSecret(
      tenant.sanityWriteTokenEncrypted,
      env.TENANT_TOKEN_ENCRYPTION_KEY,
    ),
    status: tenant.status,
    deprovisionedAt: tenant.deprovisionedAt,
    provisioningStatus: tenant.provisioningStatus,
  };
}
