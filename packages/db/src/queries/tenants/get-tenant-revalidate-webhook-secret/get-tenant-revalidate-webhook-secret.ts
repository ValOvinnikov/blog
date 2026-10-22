import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { decryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantRevalidateWebhookSecret = {
  tenantId: string;
  secret: TMaybeUndefined<string>;
};

export async function getTenantRevalidateWebhookSecret(
  sanityProjectId: string,
): Promise<TMaybeUndefined<TTenantRevalidateWebhookSecret>> {
  const [tenant] = await getDb()
    .select({
      id: tenants.id,
      secretEncrypted: tenants.revalidateWebhookSecretEncrypted,
    })
    .from(tenants)
    .where(eq(tenants.sanityProjectId, sanityProjectId));

  if (!tenant) return undefined;

  const { id, secretEncrypted } = tenant;

  return {
    tenantId: id,
    secret: secretEncrypted
      ? decryptSecret(secretEncrypted, requireTenantTokenEncryptionKey())
      : undefined,
  };
}
