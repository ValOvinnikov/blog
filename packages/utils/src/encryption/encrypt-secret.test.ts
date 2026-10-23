import { decryptSecret, encryptSecret } from './encrypt-secret';
import {
  MOCK_OTHER_ENCRYPTION_KEY,
  MOCK_ENCRYPTION_KEY,
} from './encryption-fixtures';

const SECRET = 'sk-test-token-value';
const SAME_VALUE = 'same-value';

describe('encryptSecret / decryptSecret', () => {
  describe('with an encrypted secret', () => {
    let encrypted: string;

    beforeEach(() => {
      encrypted = encryptSecret(SECRET, MOCK_ENCRYPTION_KEY);
    });

    it('round-trips a plaintext secret', () => {
      expect(encrypted).not.toContain(SECRET);
      expect(decryptSecret(encrypted, MOCK_ENCRYPTION_KEY)).toBe(SECRET);
    });

    it('rejects decryption with the wrong key', () => {
      expect(() =>
        decryptSecret(encrypted, MOCK_OTHER_ENCRYPTION_KEY),
      ).toThrow();
    });
  });

  it('produces a different ciphertext for the same plaintext on each call', () => {
    const first = encryptSecret(SAME_VALUE, MOCK_ENCRYPTION_KEY);
    const second = encryptSecret(SAME_VALUE, MOCK_ENCRYPTION_KEY);

    expect(first).not.toBe(second);
    expect(decryptSecret(first, MOCK_ENCRYPTION_KEY)).toBe(SAME_VALUE);
    expect(decryptSecret(second, MOCK_ENCRYPTION_KEY)).toBe(SAME_VALUE);
  });

  it('rejects a malformed encrypted value', () => {
    expect(() =>
      decryptSecret('not-a-valid-payload', MOCK_ENCRYPTION_KEY),
    ).toThrow('Malformed encrypted secret.');
  });

  it('round-trips an empty-string secret', () => {
    expect(
      decryptSecret(
        encryptSecret('', MOCK_ENCRYPTION_KEY),
        MOCK_ENCRYPTION_KEY,
      ),
    ).toBe('');
  });
});
