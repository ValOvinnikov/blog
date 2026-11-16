import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

export async function setTenantRevalidateWebhookSecret(
  tenantId: string,
  plaintextSecret: string,
): Promise<void> {
  const encrypted = encryptSecret(
    plaintextSecret,
    requireTenantTokenEncryptionKey(),
  );

  await getDb()
    .update(tenants)
    .set({ revalidateWebhookSecretEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
