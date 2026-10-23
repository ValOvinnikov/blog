import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

export function useTenantTokenEncryptionKey(): void {
  beforeEach(() => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', MOCK_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

export const MISSING_TENANT_TOKEN_KEY_ERROR =
  'TENANT_TOKEN_ENCRYPTION_KEY is not configured.';
