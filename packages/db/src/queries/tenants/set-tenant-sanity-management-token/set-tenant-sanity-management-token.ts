import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@blog/utils';
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
