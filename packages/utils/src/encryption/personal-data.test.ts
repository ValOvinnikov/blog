import { KEY_ENCODING } from './crypto-encoding';
import {
  OTHER_TEST_ENCRYPTION_KEY as KEY_V2,
  TEST_ENCRYPTION_KEY as KEY_V1,
} from './encryption-fixtures';
import {
  accountEmailIndex,
  decryptPersonalData,
  encryptPersonalData,
  isPersonalDataKey,
  isPersonalDataKeyring,
  parsePersonalDataKeyring,
  personalDataIndex,
} from './personal-data';
const LOCAL_PART = 'reader';
const ADDRESS = `${LOCAL_PART}@example.com`;
const KEYRING_V1 = parsePersonalDataKeyring(`v1:${KEY_V1}`);
const KEYRING_V2 = parsePersonalDataKeyring(`v2:${KEY_V2},v1:${KEY_V1}`);
const MALFORMED_KEYRING = 'Malformed personal data keyring.';
const SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);
const LONG_KEY = Buffer.alloc(33).toString(KEY_ENCODING);
const NON_BASE64_KEY = `${KEY_V1.slice(0, -2)}!=`;
const BAD_KEYS: [string, string][] = [
  ['a short key', SHORT_KEY],
  ['a long key', LONG_KEY],
  ['a key that is not base64', NON_BASE64_KEY],
];

describe(parsePersonalDataKeyring, () => {
  it('encrypts with the first entry and keeps every entry for decryption', () => {
    expect(KEYRING_V2).toEqual({
      currentVersion: 'v2',
      keys: { v2: KEY_V2, v1: KEY_V1 },
    });
  });

  it.each<[string, string]>([
    ['an empty value', ''],
    ['an entry with no key', 'v1:'],
    ['an entry with no version', KEY_V1],
    ['a version not shaped v<n>', `one:${KEY_V1}`],
    ['a repeated version', `v1:${KEY_V1},v1:${KEY_V2}`],
    ...BAD_KEYS.map(([label, key]): [string, string] => [label, `v1:${key}`]),
    ['a bad key in an older version', `v2:${KEY_V2},v1:${SHORT_KEY}`],
  ])('rejects %s', (_label, raw) => {
    expect(() => parsePersonalDataKeyring(raw)).toThrow(MALFORMED_KEYRING);
  });
});

describe(isPersonalDataKeyring, () => {
  it('accepts a keyring whose every version holds a 32-byte key', () => {
    expect(isPersonalDataKeyring(`v2:${KEY_V2},v1:${KEY_V1}`)).toBe(true);
  });

  it('rejects a keyring whose older version holds a long key', () => {
    expect(isPersonalDataKeyring(`v2:${KEY_V2},v1:${LONG_KEY}`)).toBe(false);
  });
});

describe(isPersonalDataKey, () => {
  it('accepts a 32-byte base64 key', () => {
    expect(isPersonalDataKey(KEY_V1)).toBe(true);
  });

  it.each<[string, string]>([
    ...BAD_KEYS,
    ['a key with surrounding whitespace', ` ${KEY_V1}`],
  ])('rejects %s as a key', (_label, key) => {
    expect(isPersonalDataKey(key)).toBe(false);
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
    ['a version the keyring lacks', 'v9:iv.tag.ciphertext'],
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
    expect(personalDataIndex(ADDRESS, KEY_V1)).not.toContain(LOCAL_PART);
  });
});

describe(accountEmailIndex, () => {
  it('gives two casings of one address the same index', () => {
    expect(accountEmailIndex(' Reader@Example.com ', KEY_V1)).toBe(
      accountEmailIndex(ADDRESS, KEY_V1),
    );
  });

  it('gives a +tag variant of an address its own index', () => {
    expect(accountEmailIndex('reader+news@example.com', KEY_V1)).not.toBe(
      accountEmailIndex(ADDRESS, KEY_V1),
    );
  });

  it('keeps the address out of the account index', () => {
    expect(accountEmailIndex(ADDRESS, KEY_V1)).not.toContain(LOCAL_PART);
  });
});
