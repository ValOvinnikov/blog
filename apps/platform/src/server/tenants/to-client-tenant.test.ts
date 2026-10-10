import { makeTenant } from '@platform/testing/tenants/fixtures';

import { toClientTenant } from './to-client-tenant';

describe(toClientTenant, () => {
  it('leaves out both Sanity token ciphertexts', () => {
    const clientTenant = toClientTenant(
      makeTenant({
        sanityReadTokenEncrypted: 'read-ciphertext',
        sanityWriteTokenEncrypted: 'write-ciphertext',
      }),
    );

    expect(JSON.stringify(clientTenant)).not.toContain('read-ciphertext');
    expect(JSON.stringify(clientTenant)).not.toContain('write-ciphertext');
  });

  it('reports a stored read token', () => {
    expect(
      toClientTenant(makeTenant({ sanityReadTokenEncrypted: 'ciphertext' }))
        .hasSanityReadToken,
    ).toBe(true);
  });

  it('reports a missing read token', () => {
    expect(
      toClientTenant(makeTenant({ sanityReadTokenEncrypted: null }))
        .hasSanityReadToken,
    ).toBe(false);
  });
});
