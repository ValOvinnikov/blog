import type { TTenant } from '@blog/db/schema/tenants';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

const MOCK_SANITY_READ_TOKEN_ENCRYPTED = 'encrypted-read-token';

export const mockStudioReadyTenant = (
  overrides: Partial<TTenant> = {},
): TTenant =>
  mockReadyTenant({
    sanityReadTokenEncrypted: MOCK_SANITY_READ_TOKEN_ENCRYPTED,
    ...overrides,
  });
