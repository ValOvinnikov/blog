import { env } from '@blog/db/utils/env/env';

export function requireTenantTokenEncryptionKey(): string {
  const key = env.TENANT_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  return key;
}
