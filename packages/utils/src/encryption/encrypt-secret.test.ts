import { decryptSecret, encryptSecret } from './encrypt-secret';

// 32 random bytes, base64-encoded — a throwaway test key, not a real secret.
const TEST_KEY = 'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';

describe('encryptSecret / decryptSecret', () => {
  it('round-trips a plaintext secret', () => {
    const encrypted = encryptSecret('sk-test-token-value', TEST_KEY);

    expect(encrypted).not.toContain('sk-test-token-value');
    expect(decryptSecret(encrypted, TEST_KEY)).toBe('sk-test-token-value');
  });

  it('produces a different ciphertext for the same plaintext on each call', () => {
    const first = encryptSecret('same-value', TEST_KEY);
    const second = encryptSecret('same-value', TEST_KEY);

    expect(first).not.toBe(second);
    expect(decryptSecret(first, TEST_KEY)).toBe('same-value');
    expect(decryptSecret(second, TEST_KEY)).toBe('same-value');
  });

  it('rejects decryption with the wrong key', () => {
    const encrypted = encryptSecret('sk-test-token-value', TEST_KEY);
    const wrongKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';

    expect(() => decryptSecret(encrypted, wrongKey)).toThrow();
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
