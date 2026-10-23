import {
  makeReadyTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { toTenantSwitcherItems } from './tenant-switcher-items';

describe(toTenantSwitcherItems, () => {
  it('keeps only the id, name, primary domain and archived state of each tenant', () => {
    const tenant = makeReadyTenant({
      sanityReadTokenEncrypted: 'read-ciphertext',
      sanityWriteTokenEncrypted: 'write-ciphertext',
    });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      {
        id: TENANT_ID,
        name: MOCK_TENANT_NAME,
        primaryDomain: MOCK_TENANT_DOMAIN,
        isArchived: false,
      },
    ]);
  });

  it('marks a deprovisioned tenant as archived', () => {
    const tenant = makeReadyTenant({
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      {
        id: TENANT_ID,
        name: MOCK_TENANT_NAME,
        primaryDomain: MOCK_TENANT_DOMAIN,
        isArchived: true,
      },
    ]);
  });
});
