import type { TTenantSanityContext } from '@blog/service/sanity/query/query';

export const MOCK_TENANT_PROJECT_ID = 'tenant-a';
export const MOCK_TENANT_DATASET = 'production';
export const MOCK_TENANT_TOKEN = 'tok-a';
export const MOCK_PREVIOUS_TOKEN = 'tok-old';
export const MOCK_ROTATED_TOKEN = 'tok-new';
export const MOCK_PLATFORM_PROJECT_ID = 'platform-project';
export const MOCK_ENV_PROJECT_ID = 'env-project';

export function mockTenant(
  overrides: Partial<TTenantSanityContext> = {},
): TTenantSanityContext {
  return {
    projectId: MOCK_TENANT_PROJECT_ID,
    dataset: MOCK_TENANT_DATASET,
    token: MOCK_TENANT_TOKEN,
    ...overrides,
  };
}
