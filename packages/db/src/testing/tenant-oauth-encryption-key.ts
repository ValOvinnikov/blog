import { MOCK_OTHER_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

export const MOCK_TENANT_OAUTH_ENCRYPTION_KEY = MOCK_OTHER_ENCRYPTION_KEY;

export function useTenantOAuthEncryptionKey(): void {
  beforeEach(() => {
    vi.stubEnv('TENANT_OAUTH_ENCRYPTION_KEY', MOCK_TENANT_OAUTH_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

export const MISSING_TENANT_OAUTH_KEY_ERROR =
  'TENANT_OAUTH_ENCRYPTION_KEY is not configured.';
