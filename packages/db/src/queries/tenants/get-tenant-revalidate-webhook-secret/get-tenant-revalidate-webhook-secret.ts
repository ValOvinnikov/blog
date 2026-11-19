import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { decryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
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
    secret: secretEncrypted ? decryptTenantSecret(secretEncrypted) : undefined,
  };
}
