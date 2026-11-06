import type { TOAuthCredentials } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { requireTenantOAuthEncryptionKey } from '@blog/db/utils/tenant-oauth-encryption-key/tenant-oauth-encryption-key';
import { decryptSecret } from '@blog/utils';
import { hasLength } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

export type TTenantOAuthCredentialsByProvider = Partial<
  Record<TOAuthProvider, TOAuthCredentials>
>;

export async function getTenantOAuthCredentials(
  tenantId: string,
): Promise<TTenantOAuthCredentialsByProvider> {
  const rows = await getDb()
    .select({
      provider: tenantOAuthCredentials.provider,
      clientId: tenantOAuthCredentials.clientId,
      clientSecretEncrypted: tenantOAuthCredentials.clientSecretEncrypted,
    })
    .from(tenantOAuthCredentials)
    .where(eq(tenantOAuthCredentials.tenantId, tenantId));

  if (!hasLength(rows)) return {};

  const key = requireTenantOAuthEncryptionKey();

  return Object.fromEntries(
    rows.map(({ provider, clientId, clientSecretEncrypted }) => [
      provider,
      { clientId, clientSecret: decryptSecret(clientSecretEncrypted, key) },
    ]),
  );
}
