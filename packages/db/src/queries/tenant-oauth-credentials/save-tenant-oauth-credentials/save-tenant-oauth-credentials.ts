import { OAUTH_PROVIDER } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { requireTenantTokenEncryptionKey } from '@blog/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { encryptSecret } from '@blog/utils';
import { z } from 'zod';

export const saveTenantOAuthCredentialsInputSchema = z.object({
  provider: z.enum(OAUTH_PROVIDER),
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
});

export type TSaveTenantOAuthCredentialsInput = z.input<
  typeof saveTenantOAuthCredentialsInputSchema
>;

export async function saveTenantOAuthCredentials(
  tenantId: string,
  input: TSaveTenantOAuthCredentialsInput,
): Promise<void> {
  const { provider, clientId, clientSecret } =
    saveTenantOAuthCredentialsInputSchema.parse(input);
  const clientSecretEncrypted = encryptSecret(
    clientSecret,
    requireTenantTokenEncryptionKey(),
  );

  await getDb()
    .insert(tenantOAuthCredentials)
    .values({ tenantId, provider, clientId, clientSecretEncrypted })
    .onConflictDoUpdate({
      target: [
        tenantOAuthCredentials.tenantId,
        tenantOAuthCredentials.provider,
      ],
      set: { clientId, clientSecretEncrypted, updatedAt: new Date() },
    });
}
