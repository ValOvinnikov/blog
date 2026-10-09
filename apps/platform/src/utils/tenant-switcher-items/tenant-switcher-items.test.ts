import { makeReadyTenant } from '@platform/testing/tenants/fixtures';

import { toTenantSwitcherItems } from './tenant-switcher-items';

describe(toTenantSwitcherItems, () => {
  it('keeps only the id, name, primary domain and archived state of each tenant', () => {
    const tenant = makeReadyTenant({
      sanityReadTokenEncrypted: 'read-ciphertext',
      sanityWriteTokenEncrypted: 'write-ciphertext',
    });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      {
        id: 'tenant-1',
        name: 'Acme Inc.',
        primaryDomain: 'acme.example.com',
        isArchived: false,
      },
    ]);
  });

  it('marks a deprovisioned tenant as archived', () => {
    const tenant = makeReadyTenant({
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    expect(toTenantSwitcherItems([tenant])).toStrictEqual([
      expect.objectContaining({ isArchived: true }),
    ]);
  });
});
