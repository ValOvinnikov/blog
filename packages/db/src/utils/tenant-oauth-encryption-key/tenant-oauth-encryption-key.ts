import { env } from '@blog/db/utils/env/env';

export function requireTenantOAuthEncryptionKey(): string {
  const key = env.TENANT_OAUTH_ENCRYPTION_KEY;
  if (!key) throw new Error('TENANT_OAUTH_ENCRYPTION_KEY is not configured.');
  return key;
}
