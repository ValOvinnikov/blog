import { createMockFaker } from '@platform/testing/mock-faker';
import {
  toPinnedTenant,
  type TPinnedTenant,
} from '@platform/utils/pinned-tenants/pinned-tenants';

import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
} from './fixtures';
import { mockTenantsPageRow } from './tenants-page-row';

const mockFaker = createMockFaker(8079);

const MOCK_THIRD_TENANT_ID = mockFaker.string.uuid();
const MOCK_THIRD_TENANT_NAME = 'Initech Ltd.';
const MOCK_THIRD_TENANT_DOMAIN = 'initech.example.net';

export const mockPinnedTenant = (
  overrides: Partial<TPinnedTenant> = {},
): TPinnedTenant => toPinnedTenant({ ...mockTenantsPageRow(), ...overrides });

export const mockOtherPinnedTenant = (
  overrides: Partial<TPinnedTenant> = {},
): TPinnedTenant =>
  mockPinnedTenant({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    ...overrides,
  });

export const mockThirdPinnedTenant = (
  overrides: Partial<TPinnedTenant> = {},
): TPinnedTenant =>
  mockPinnedTenant({
    id: MOCK_THIRD_TENANT_ID,
    name: MOCK_THIRD_TENANT_NAME,
    primaryDomain: MOCK_THIRD_TENANT_DOMAIN,
    ...overrides,
  });
