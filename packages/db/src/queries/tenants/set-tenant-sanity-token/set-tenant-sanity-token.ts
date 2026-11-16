import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

export async function setTenantSanityToken(
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
    .set({ sanityReadTokenEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
