import { LOCALE_ISO_CODES } from '@blog/config';
import type { queries } from '@blog/db';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

type TTenantSanityCredentials = NonNullable<
  ReturnType<typeof queries.tenants.toTenantSanityCredentials>
>;

type TTenantSanityWriteCredentials = NonNullable<
  ReturnType<typeof queries.tenants.toTenantSanityWriteCredentials>
>;

const MOCK_ENCRYPTED_READ_TOKEN = faker.string.alphanumeric(32);

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
