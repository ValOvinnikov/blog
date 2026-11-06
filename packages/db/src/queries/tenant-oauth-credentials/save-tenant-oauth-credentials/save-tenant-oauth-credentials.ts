import { OAUTH_PROVIDER } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { requireTenantOAuthEncryptionKey } from '@blog/db/utils/tenant-oauth-encryption-key/tenant-oauth-encryption-key';
import { encryptSecret } from '@blog/utils';
import { z } from 'zod';

export const saveTenantOAuthCredentialsInputSchema = z.object({
  provider: z.enum(OAUTH_PROVIDER),
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
  callbackDomain: z.string().trim().min(1).optional(),
});

export type TSaveTenantOAuthCredentialsInput = z.input<
  typeof saveTenantOAuthCredentialsInputSchema
>;

export async function saveTenantOAuthCredentials(
  tenantId: string,
  input: TSaveTenantOAuthCredentialsInput,
): Promise<void> {
  const {
    provider,
    clientId,
    clientSecret,
    callbackDomain = null,
  } = saveTenantOAuthCredentialsInputSchema.parse(input);
  const clientSecretEncrypted = encryptSecret(
    clientSecret,
    requireTenantOAuthEncryptionKey(),
  );

  await getDb()
    .insert(tenantOAuthCredentials)
    .values({
      tenantId,
      provider,
      clientId,
      clientSecretEncrypted,
      callbackDomain,
    })
    .onConflictDoUpdate({
      target: [
        tenantOAuthCredentials.tenantId,
        tenantOAuthCredentials.provider,
      ],
      set: { clientId, clientSecretEncrypted, callbackDomain },
    });
}
