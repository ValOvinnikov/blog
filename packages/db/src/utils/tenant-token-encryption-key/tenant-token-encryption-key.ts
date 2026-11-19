import { env } from '@shinefold/db/utils/env/env';
import { decryptSecret, encryptSecret } from '@shinefold/utils';

function requireTenantTokenEncryptionKey(): string {
  const key = env.TENANT_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  return key;
}

export function encryptTenantSecret(plaintext: string): string {
  return encryptSecret(plaintext, requireTenantTokenEncryptionKey());
}

export function decryptTenantSecret(encrypted: string): string {
  return decryptSecret(encrypted, requireTenantTokenEncryptionKey());
}
