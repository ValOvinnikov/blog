import { faker } from '@faker-js/faker';

import { decryptSecret, encryptSecret } from './encrypt-secret';
import {
  MOCK_OTHER_ENCRYPTION_KEY,
  MOCK_ENCRYPTION_KEY,
} from './encryption-fixtures';

faker.seed(6029);

const MOCK_SECRET = faker.string.alphanumeric(24);
const MOCK_MALFORMED_PAYLOAD = faker.lorem.slug();

describe(encryptSecret, () => {
  it.each([
    ['a secret', MOCK_SECRET],
    ['an empty string', ''],
  ])('round-trips %s', (_label, plaintext) => {
    const encrypted = encryptSecret(plaintext, MOCK_ENCRYPTION_KEY);

    expect(decryptSecret(encrypted, MOCK_ENCRYPTION_KEY)).toBe(plaintext);
  });

  it('never stores the plaintext readably', () => {
    const encrypted = encryptSecret(MOCK_SECRET, MOCK_ENCRYPTION_KEY);

    expect(encrypted).not.toContain(MOCK_SECRET);
  });

  it('produces a different ciphertext for the same plaintext on each call', () => {
    const first = encryptSecret(MOCK_SECRET, MOCK_ENCRYPTION_KEY);
    const second = encryptSecret(MOCK_SECRET, MOCK_ENCRYPTION_KEY);

    expect(first).not.toBe(second);
  });
});

describe(decryptSecret, () => {
  it('rejects decryption with the wrong key', () => {
    const encrypted = encryptSecret(MOCK_SECRET, MOCK_ENCRYPTION_KEY);

    expect(() => decryptSecret(encrypted, MOCK_OTHER_ENCRYPTION_KEY)).toThrow();
  });

  it('rejects a malformed encrypted value', () => {
    expect(() =>
      decryptSecret(MOCK_MALFORMED_PAYLOAD, MOCK_ENCRYPTION_KEY),
    ).toThrow('Malformed encrypted secret.');
  });
});
