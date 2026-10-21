import {
  decryptPersonalData,
  encryptPersonalData,
  parsePersonalDataKeyring,
  personalDataIndex,
} from './personal-data';

const KEY_V1 = 'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';
const KEY_V2 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';
const ADDRESS = 'reader@example.com';
const KEYRING_V1 = parsePersonalDataKeyring(`v1:${KEY_V1}`);
const KEYRING_V2 = parsePersonalDataKeyring(`v2:${KEY_V2},v1:${KEY_V1}`);
const MALFORMED_KEYRING = 'Malformed personal data keyring.';

describe(parsePersonalDataKeyring, () => {
  it('encrypts with the first entry and keeps every entry for decryption', () => {
    expect(KEYRING_V2).toEqual({
      currentVersion: 'v2',
      keys: { v2: KEY_V2, v1: KEY_V1 },
    });
  });

  it.each([
    ['an empty value', ''],
    ['an entry with no key', 'v1:'],
    ['an entry with no version', KEY_V1],
    ['a version not shaped v<n>', `one:${KEY_V1}`],
    ['a repeated version', `v1:${KEY_V1},v1:${KEY_V2}`],
  ])('rejects %s', (_label, raw) => {
    expect(() => parsePersonalDataKeyring(raw)).toThrow(MALFORMED_KEYRING);
  });
});

describe(encryptPersonalData, () => {
  it('round-trips a value without storing it readably', () => {
    const encrypted = encryptPersonalData(ADDRESS, KEYRING_V1);

    expect(encrypted).not.toContain(ADDRESS);
    expect(decryptPersonalData(encrypted, KEYRING_V1)).toBe(ADDRESS);
  });

  it('prefixes the stored form with the current key version', () => {
    expect(encryptPersonalData(ADDRESS, KEYRING_V2)).toMatch(/^v2:/);
  });

  it('throws when the current version has no key', () => {
    expect(() =>
      encryptPersonalData(ADDRESS, { currentVersion: 'v3', keys: {} }),
    ).toThrow('Missing current personal data key.');
  });
});

describe(decryptPersonalData, () => {
  it('decrypts a value stored under an older key version with that key', () => {
    const encrypted = encryptPersonalData(ADDRESS, KEYRING_V1);

    expect(decryptPersonalData(encrypted, KEYRING_V2)).toBe(ADDRESS);
  });

  it('rejects a value when its version maps to the wrong key', () => {
    const encrypted = encryptPersonalData(ADDRESS, KEYRING_V1);
    const wrongKeyring = parsePersonalDataKeyring(`v1:${KEY_V2}`);

    expect(() => decryptPersonalData(encrypted, wrongKeyring)).toThrow();
  });

  it.each([
    ['a version the keyring lacks', `v9:${'x'.repeat(8)}`],
    ['no version prefix', 'iv.tag.ciphertext'],
    ['an empty version', ':iv.tag.ciphertext'],
    ['an inherited property name', 'constructor:iv.tag.ciphertext'],
  ])('rejects a stored value with %s', (_label, encrypted) => {
    expect(() => decryptPersonalData(encrypted, KEYRING_V2)).toThrow(
      'Unknown personal data key version.',
    );
  });
});

describe(personalDataIndex, () => {
  it('gives two spellings of one address the same index', () => {
    expect(personalDataIndex(' Reader+news@Example.com', KEY_V1)).toBe(
      personalDataIndex(ADDRESS, KEY_V1),
    );
  });

  it('gives different addresses different indexes', () => {
    expect(personalDataIndex('writer@example.com', KEY_V1)).not.toBe(
      personalDataIndex(ADDRESS, KEY_V1),
    );
  });

  it('gives one address a different index under another key', () => {
    expect(personalDataIndex(ADDRESS, KEY_V2)).not.toBe(
      personalDataIndex(ADDRESS, KEY_V1),
    );
  });

  it('never contains the address', () => {
    expect(personalDataIndex(ADDRESS, KEY_V1)).not.toContain('reader');
  });
});
