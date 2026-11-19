import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { encryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { eq } from 'drizzle-orm';

export async function setTenantSanityManagementToken(
  tenantId: string,
  minted: { token: string; robotId: string },
): Promise<void> {
  const db = getDb();
  const encrypted = encryptTenantSecret(minted.token);

  await db
    .update(tenants)
    .set({
      sanityManagementTokenEncrypted: encrypted,
      sanityManagementRobotId: minted.robotId,
    })
    .where(eq(tenants.id, tenantId));
}
