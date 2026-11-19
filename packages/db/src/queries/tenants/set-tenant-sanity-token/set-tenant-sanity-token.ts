import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { encryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { eq } from 'drizzle-orm';

export async function setTenantSanityToken(
  tenantId: string,
  plaintextToken: string,
): Promise<void> {
  const db = getDb();
  const encrypted = encryptTenantSecret(plaintextToken);

  await db
    .update(tenants)
    .set({ sanityReadTokenEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
