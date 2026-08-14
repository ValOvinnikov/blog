import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { env } from '@blog/db/utils/env/env';
import { encryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export async function setTenantSanityToken(
  tenantId: string,
  plaintextToken: string,
): Promise<void> {
  if (!env.TENANT_TOKEN_ENCRYPTION_KEY) {
    throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  const db = getDb();
  const encrypted = encryptSecret(
    plaintextToken,
    env.TENANT_TOKEN_ENCRYPTION_KEY,
  );

  // A no-op if `tenantId` doesn't match a `tenants` row, matching this
  // package's other update/delete-style mutations (see `updateDisplayName`).
  await db
    .update(tenants)
    .set({ sanityReadTokenEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
