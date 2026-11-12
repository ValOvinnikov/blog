import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials';
import type { TTenantSanityWriteCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-write-credentials/get-tenant-sanity-write-credentials';
import type { TTenant } from '@blog/db/schema/tenants';
import { createMockFaker } from '@web/testing/mock-faker';
import {
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

const mockFaker = createMockFaker(61060);

const MOCK_ENCRYPTED_READ_TOKEN = mockFaker.string.alphanumeric(32);

export const mockServableTenant = (overrides: Partial<TTenant> = {}): TTenant =>
  mockTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_READ_TOKEN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    ...overrides,
  });

export const mockTenantSanityCredentials = (
  overrides: Partial<TTenantSanityCredentials> = {},
): TTenantSanityCredentials => ({
  ...MOCK_TENANT_SANITY_CONTEXT,
  defaultLocale: LOCALE_ISO_CODES.EN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  ...overrides,
});

export const mockTenantSanityWriteCredentials = (
  overrides: Partial<TTenantSanityWriteCredentials> = {},
): TTenantSanityWriteCredentials => ({
  ...MOCK_TENANT_SANITY_CONTEXT,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  ...overrides,
});
