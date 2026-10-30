import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export async function setTenantSanityManagementToken(
  tenantId: string,
  plaintextToken: string,
): Promise<void> {
  const db = getDb();
  const encrypted = encryptSecret(
    plaintextToken,
    requireTenantTokenEncryptionKey(),
  );

  await db
    .update(tenants)
    .set({ sanityManagementTokenEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
