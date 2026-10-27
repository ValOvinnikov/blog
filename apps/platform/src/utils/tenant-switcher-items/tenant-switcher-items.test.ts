import { faker } from '@faker-js/faker';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { toTenantSwitcherItems } from './tenant-switcher-items';

faker.seed(6006);

const MOCK_READ_TOKEN_CIPHERTEXT = faker.string.alphanumeric(24);
const MOCK_WRITE_TOKEN_CIPHERTEXT = faker.string.alphanumeric(24);

const MOCK_SWITCHER_ITEM = {
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
};

describe(toTenantSwitcherItems, () => {
  it('keeps only the id, name, primary domain and archived state of each tenant', () => {
    const tenant = mockReadyTenant({
      sanityReadTokenEncrypted: MOCK_READ_TOKEN_CIPHERTEXT,
      sanityWriteTokenEncrypted: MOCK_WRITE_TOKEN_CIPHERTEXT,
    });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      { ...MOCK_SWITCHER_ITEM, isArchived: false },
    ]);
  });

  it('marks a deprovisioned tenant as archived', () => {
    const tenant = mockReadyTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      { ...MOCK_SWITCHER_ITEM, isArchived: true },
    ]);
  });
});
