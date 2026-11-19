import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { encryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { eq } from 'drizzle-orm';

export async function setTenantRevalidateWebhookSecret(
  tenantId: string,
  plaintextSecret: string,
): Promise<void> {
  const encrypted = encryptTenantSecret(plaintextSecret);

  await getDb()
    .update(tenants)
    .set({ revalidateWebhookSecretEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
