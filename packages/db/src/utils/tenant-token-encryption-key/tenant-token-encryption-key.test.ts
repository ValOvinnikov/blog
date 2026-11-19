import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import { MOCK_REVALIDATE_WEBHOOK_SECRET } from '@shinefold/db/testing/tenants/fixtures';

import {
  decryptTenantSecret,
  encryptTenantSecret,
} from './tenant-token-encryption-key';

useTenantTokenEncryptionKey();

describe(encryptTenantSecret, () => {
  it('produces a value that decrypts back to the plaintext', () => {
    const encrypted = encryptTenantSecret(MOCK_REVALIDATE_WEBHOOK_SECRET);

    expect(encrypted).not.toBe(MOCK_REVALIDATE_WEBHOOK_SECRET);
    expect(decryptTenantSecret(encrypted)).toBe(MOCK_REVALIDATE_WEBHOOK_SECRET);
  });

  it('throws when the encryption key is not configured', () => {
    unsetTenantTokenEncryptionKey();

    expect(() => encryptTenantSecret(MOCK_REVALIDATE_WEBHOOK_SECRET)).toThrow(
      MISSING_TENANT_TOKEN_KEY_ERROR,
    );
  });
});

describe(decryptTenantSecret, () => {
  it('throws without a configured key, even for a value it encrypted', () => {
    const encrypted = encryptTenantSecret(MOCK_REVALIDATE_WEBHOOK_SECRET);
    unsetTenantTokenEncryptionKey();

    expect(() => decryptTenantSecret(encrypted)).toThrow(
      MISSING_TENANT_TOKEN_KEY_ERROR,
    );
  });
});
