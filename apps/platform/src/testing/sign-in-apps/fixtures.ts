import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { mockOwnerContext } from '@platform/testing/custom-domain/fixtures';
import { MOCK_TENANT_URL } from '@platform/testing/tenants/fixtures';
import { OAUTH_PROVIDER, TENANT_PLAN } from '@shinefold/config/constants';
import type { TTenantOAuthClient } from '@shinefold/db/queries/tenant-oauth-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const MOCK_CLIENT_ID = '1234567890-abcdefghij.apps.example.com';
export const MOCK_MASKED_CLIENT_ID = '123456••••••••';
export const MOCK_REPLACEMENT_CLIENT_ID = 'replacement-client-id';
export const MOCK_CLIENT_SECRET = 'mock-client-secret';
export const MOCK_GOOGLE_CALLBACK_URL = `${MOCK_TENANT_URL}/api/auth/callback/google`;

export const mockSignInAppsDb = () => ({
  queries: {
    tenantOAuthCredentials: {
      listTenantOAuthClients: vi.fn(),
      saveTenantOAuthCredentials: vi.fn(),
      updateTenantOAuthClient: vi.fn(),
      clearTenantOAuthCredentials: vi.fn(),
      confirmTenantOAuthCallbackDomain: vi.fn(),
    },
  },
});

export const mockGrowthOwnerContext = (overrides: Partial<TTenant> = {}) =>
  mockOwnerContext({ plan: TENANT_PLAN.GROWTH, ...overrides });

export const mockOAuthClient = (
  overrides: Partial<TTenantOAuthClient> = {},
): TTenantOAuthClient => ({
  provider: OAUTH_PROVIDER.GOOGLE,
  clientId: MOCK_CLIENT_ID,
  callbackDomain: null,
  updatedAt: new Date(),
  ...overrides,
});

export const mockSignInAppView = (
  overrides: Partial<TSignInAppView> = {},
): TSignInAppView => ({
  provider: OAUTH_PROVIDER.GOOGLE,
  hasOwnApp: false,
  hasKeptApp: false,
  callbackUrl: MOCK_GOOGLE_CALLBACK_URL,
  hasCallbackWarning: false,
  ...overrides,
});
