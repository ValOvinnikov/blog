import { mockTenant } from '@platform/testing/tenants/fixtures';

import { toClientTenant } from './to-client-tenant';

const READ_CIPHERTEXT = 'read-ciphertext';
const WRITE_CIPHERTEXT = 'write-ciphertext';

describe(toClientTenant, () => {
  it('leaves out both Sanity token ciphertexts', () => {
    const serialized = JSON.stringify(
      toClientTenant(
        mockTenant({
          sanityReadTokenEncrypted: READ_CIPHERTEXT,
          sanityWriteTokenEncrypted: WRITE_CIPHERTEXT,
        }),
      ),
    );

    expect(serialized).not.toContain(READ_CIPHERTEXT);
    expect(serialized).not.toContain(WRITE_CIPHERTEXT);
  });

  it.each([
    [READ_CIPHERTEXT, true],
    [null, false],
  ])(
    'reports whether a read token is stored (%s → %s)',
    (sanityReadTokenEncrypted, hasSanityReadToken) => {
      expect(
        toClientTenant(mockTenant({ sanityReadTokenEncrypted }))
          .hasSanityReadToken,
      ).toBe(hasSanityReadToken);
    },
  );
});
