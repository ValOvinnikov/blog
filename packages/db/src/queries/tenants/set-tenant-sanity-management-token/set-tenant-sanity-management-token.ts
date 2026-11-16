import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

export async function setTenantSanityManagementToken(
  tenantId: string,
  minted: { token: string; robotId: string },
): Promise<void> {
  const db = getDb();
  const encrypted = encryptSecret(
    minted.token,
    requireTenantTokenEncryptionKey(),
  );

  await db
    .update(tenants)
    .set({
      sanityManagementTokenEncrypted: encrypted,
      sanityManagementRobotId: minted.robotId,
    })
    .where(eq(tenants.id, tenantId));
}
