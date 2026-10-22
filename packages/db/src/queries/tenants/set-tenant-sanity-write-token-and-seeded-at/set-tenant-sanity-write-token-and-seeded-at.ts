import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

/**
 * Records a tenant's Sanity write token and marks it seeded in a single
 * statement, so a crash between the two can never leave a live token
 * unrecorded against a tenant that still reads as unseeded.
 */
export async function setTenantSanityWriteTokenAndSeededAt(
  tenantId: string,
  plaintextToken: string,
  seededAt: Date,
): Promise<void> {
  const db = getDb();
  const encrypted = encryptSecret(
    plaintextToken,
    requireTenantTokenEncryptionKey(),
  );

  await db
    .update(tenants)
    .set({ sanityWriteTokenEncrypted: encrypted, seededAt })
    .where(eq(tenants.id, tenantId));
}
