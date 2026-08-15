import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { env } from '@blog/db/utils/env/env';
import { decryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantSanityCredentials = {
  projectId: string;
  dataset: string;
  token: string;
};

export async function getTenantSanityCredentials(
  tenantId: string,
): Promise<TTenantSanityCredentials | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant?.sanityReadTokenEncrypted) return undefined;

  if (!env.TENANT_TOKEN_ENCRYPTION_KEY) {
    throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  return {
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    token: decryptSecret(
      tenant.sanityReadTokenEncrypted,
      env.TENANT_TOKEN_ENCRYPTION_KEY,
    ),
  };
}
