import { faker } from '@faker-js/faker';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import { toClientTenant } from './to-client-tenant';

faker.seed(5997);

const MOCK_READ_CIPHERTEXT = faker.string.alphanumeric(24);
const MOCK_WRITE_CIPHERTEXT = faker.string.alphanumeric(24);

describe(toClientTenant, () => {
  it('leaves out both Sanity token ciphertexts', () => {
    const serialized = JSON.stringify(
      toClientTenant(
        mockTenant({
          sanityReadTokenEncrypted: MOCK_READ_CIPHERTEXT,
          sanityWriteTokenEncrypted: MOCK_WRITE_CIPHERTEXT,
        }),
      ),
    );

    expect(serialized).not.toContain(MOCK_READ_CIPHERTEXT);
    expect(serialized).not.toContain(MOCK_WRITE_CIPHERTEXT);
  });

  it.each([
    [MOCK_READ_CIPHERTEXT, true],
    [null, false],
  ])(
    'reports whether a read token is stored (%s → %s)',
    (sanityReadTokenEncrypted, hasSanityReadToken) => {
      const { hasSanityReadToken: reported } = toClientTenant(
        mockTenant({ sanityReadTokenEncrypted }),
      );

      expect(reported).toBe(hasSanityReadToken);
    },
  );
});
