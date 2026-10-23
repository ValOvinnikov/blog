import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-credentials';
import { faker } from '@faker-js/faker';

export function mockTenantSanityCredentials(
  overrides: Partial<TTenantSanityCredentials> = {},
): TTenantSanityCredentials {
  return {
    projectId: faker.string.alphanumeric(8),
    dataset: faker.word.noun(),
    token: faker.string.alphanumeric(32),
    defaultLocale: LOCALE_ISO_CODES.EN,
    status: TENANT_STATUS.ACTIVE,
    deprovisionedAt: null,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    ...overrides,
  };
}
