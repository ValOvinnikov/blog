import { decryptSecret, encryptSecret } from './encrypt-secret';
import {
  OTHER_TEST_ENCRYPTION_KEY,
  TEST_ENCRYPTION_KEY as TEST_KEY,
} from './encryption-fixtures';

const SECRET = 'sk-test-token-value';
const SAME_VALUE = 'same-value';

describe('encryptSecret / decryptSecret', () => {
  describe('with an encrypted secret', () => {
    let encrypted: string;

    beforeEach(() => {
      encrypted = encryptSecret(SECRET, TEST_KEY);
    });

    it('round-trips a plaintext secret', () => {
      expect(encrypted).not.toContain(SECRET);
      expect(decryptSecret(encrypted, TEST_KEY)).toBe(SECRET);
    });

    it('rejects decryption with the wrong key', () => {
      expect(() =>
        decryptSecret(encrypted, OTHER_TEST_ENCRYPTION_KEY),
      ).toThrow();
    });
  });

  it('produces a different ciphertext for the same plaintext on each call', () => {
    const first = encryptSecret(SAME_VALUE, TEST_KEY);
    const second = encryptSecret(SAME_VALUE, TEST_KEY);

    expect(first).not.toBe(second);
    expect(decryptSecret(first, TEST_KEY)).toBe(SAME_VALUE);
    expect(decryptSecret(second, TEST_KEY)).toBe(SAME_VALUE);
  });

  it('rejects a malformed encrypted value', () => {
    expect(() => decryptSecret('not-a-valid-payload', TEST_KEY)).toThrow(
      'Malformed encrypted secret.',
    );
  });

  it('round-trips an empty-string secret', () => {
    expect(decryptSecret(encryptSecret('', TEST_KEY), TEST_KEY)).toBe('');
  });
});
