import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { MODULE_PACK } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';

const MOCK_SANITY_READ_TOKEN_ENCRYPTED = 'encrypted-read-token';

export const MOCK_FREE_STUDIO_ENTITLEMENTS = {
  modulePacks: [MODULE_PACK.CORE],
};

export const mockStudioReadyTenant = (overrides: Partial<TTenant> = {}) =>
  mockReadyTenant({
    sanityReadTokenEncrypted: MOCK_SANITY_READ_TOKEN_ENCRYPTED,
    ...overrides,
  });
