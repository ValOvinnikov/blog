import { faker } from '@faker-js/faker';

import { KEY_ENCODING } from './crypto-encoding';
import {
  MOCK_OTHER_ENCRYPTION_KEY as MOCK_KEY_V2,
  MOCK_ENCRYPTION_KEY as MOCK_KEY_V1,
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

faker.seed(6029);

const MOCK_LOCAL_PART = faker.internet.username().toLowerCase();
const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_TAG = faker.lorem.word();
const MOCK_ADDRESS = `${MOCK_LOCAL_PART}@${MOCK_DOMAIN}`;
const MOCK_OTHER_ADDRESS = faker.internet.email().toLowerCase();
const MOCK_SHOUTED_ADDRESS = ` ${MOCK_LOCAL_PART.toUpperCase()}@${MOCK_DOMAIN.toUpperCase()} `;
const MOCK_TAGGED_ADDRESS = `${MOCK_LOCAL_PART}+${MOCK_TAG}@${MOCK_DOMAIN}`;
const MOCK_KEYRING_V1 = parsePersonalDataKeyring(`v1:${MOCK_KEY_V1}`);
const MOCK_KEYRING_V2 = parsePersonalDataKeyring(
  `v2:${MOCK_KEY_V2},v1:${MOCK_KEY_V1}`,
);
const MOCK_SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);
const MOCK_LONG_KEY = Buffer.alloc(33).toString(KEY_ENCODING);
const MOCK_NON_BASE64_KEY = `${MOCK_KEY_V1.slice(0, -2)}!=`;
const MOCK_BAD_KEYS: [string, string][] = [
  ['a short key', MOCK_SHORT_KEY],
  ['a long key', MOCK_LONG_KEY],
  ['a key that is not base64', MOCK_NON_BASE64_KEY],
];

describe(parsePersonalDataKeyring, () => {
  it('encrypts with the first entry and keeps every entry for decryption', () => {
    expect(MOCK_KEYRING_V2).toEqual({
      currentVersion: 'v2',
      keys: { v2: MOCK_KEY_V2, v1: MOCK_KEY_V1 },
    });
  });

  it.each<[string, string]>([
    ['an empty value', ''],
    ['an entry with no key', 'v1:'],
    ['an entry with no version', MOCK_KEY_V1],
    ['a version not shaped v<n>', `one:${MOCK_KEY_V1}`],
    ['a repeated version', `v1:${MOCK_KEY_V1},v1:${MOCK_KEY_V2}`],
    ...MOCK_BAD_KEYS.map(([label, key]): [string, string] => [
      label,
      `v1:${key}`,
    ]),
    ['a bad key in an older version', `v2:${MOCK_KEY_V2},v1:${MOCK_SHORT_KEY}`],
  ])('rejects %s', (_label, raw) => {
    expect(() => parsePersonalDataKeyring(raw)).toThrow(
      'Malformed personal data keyring.',
    );
  });
});

describe(isPersonalDataKeyring, () => {
  it.each<[string, string, boolean]>([
    [
      'every version holds a 32-byte key',
      `v2:${MOCK_KEY_V2},v1:${MOCK_KEY_V1}`,
      true,
    ],
    [
      'an older version holds a long key',
      `v2:${MOCK_KEY_V2},v1:${MOCK_LONG_KEY}`,
      false,
    ],
  ])('judges a keyring where %s', (_label, raw, expected) => {
    expect(isPersonalDataKeyring(raw)).toBe(expected);
  });
});

describe(isPersonalDataKey, () => {
  it.each<[string, string, boolean]>([
    ['a 32-byte base64 key', MOCK_KEY_V1, true],
    ...MOCK_BAD_KEYS.map(([label, key]): [string, string, boolean] => [
      label,
      key,
      false,
    ]),
    ['a key with surrounding whitespace', ` ${MOCK_KEY_V1}`, false],
  ])('judges %s', (_label, key, expected) => {
    expect(isPersonalDataKey(key)).toBe(expected);
  });
});

describe(encryptPersonalData, () => {
  it('round-trips a value', () => {
    const encrypted = encryptPersonalData(MOCK_ADDRESS, MOCK_KEYRING_V1);

    expect(decryptPersonalData(encrypted, MOCK_KEYRING_V1)).toBe(MOCK_ADDRESS);
  });

  it('never stores the value readably', () => {
    const encrypted = encryptPersonalData(MOCK_ADDRESS, MOCK_KEYRING_V1);

    expect(encrypted).not.toContain(MOCK_ADDRESS);
  });

  it('prefixes the stored form with the current key version', () => {
    expect(encryptPersonalData(MOCK_ADDRESS, MOCK_KEYRING_V2)).toMatch(/^v2:/);
  });

  it('throws when the current version has no key', () => {
    expect(() =>
      encryptPersonalData(MOCK_ADDRESS, { currentVersion: 'v3', keys: {} }),
    ).toThrow('Missing current personal data key.');
  });
});

describe(decryptPersonalData, () => {
  describe('with a value stored under the v1 key', () => {
    let encrypted: string;

    beforeEach(() => {
      encrypted = encryptPersonalData(MOCK_ADDRESS, MOCK_KEYRING_V1);
    });

    it('decrypts it with a keyring that keeps v1 as an older version', () => {
      expect(decryptPersonalData(encrypted, MOCK_KEYRING_V2)).toBe(
        MOCK_ADDRESS,
      );
    });

    it('rejects it when v1 maps to the wrong key', () => {
      const wrongKeyring = parsePersonalDataKeyring(`v1:${MOCK_KEY_V2}`);

      expect(() => decryptPersonalData(encrypted, wrongKeyring)).toThrow();
    });
  });

  it.each([
    ['a version the keyring lacks', 'v9:iv.tag.ciphertext'],
    ['no version prefix', 'iv.tag.ciphertext'],
    ['an empty version', ':iv.tag.ciphertext'],
    ['an inherited property name', 'constructor:iv.tag.ciphertext'],
  ])('rejects a stored value with %s', (_label, encrypted) => {
    expect(() => decryptPersonalData(encrypted, MOCK_KEYRING_V2)).toThrow(
      'Unknown personal data key version.',
    );
  });
});

describe.each([personalDataIndex, accountEmailIndex])('%o', (indexEmail) => {
  it('gives different addresses different indexes', () => {
    expect(indexEmail(MOCK_OTHER_ADDRESS, MOCK_KEY_V1)).not.toBe(
      indexEmail(MOCK_ADDRESS, MOCK_KEY_V1),
    );
  });

  it('gives one address a different index under another key', () => {
    expect(indexEmail(MOCK_ADDRESS, MOCK_KEY_V2)).not.toBe(
      indexEmail(MOCK_ADDRESS, MOCK_KEY_V1),
    );
  });

  it('never contains the address', () => {
    expect(indexEmail(MOCK_ADDRESS, MOCK_KEY_V1)).not.toContain(
      MOCK_LOCAL_PART,
    );
  });

  it('indexes a case or whitespace variant the same as the address', () => {
    expect(indexEmail(MOCK_SHOUTED_ADDRESS, MOCK_KEY_V1)).toBe(
      indexEmail(MOCK_ADDRESS, MOCK_KEY_V1),
    );
  });
});

describe(personalDataIndex, () => {
  it('indexes a +tag variant the same as the address', () => {
    expect(personalDataIndex(MOCK_TAGGED_ADDRESS, MOCK_KEY_V1)).toBe(
      personalDataIndex(MOCK_ADDRESS, MOCK_KEY_V1),
    );
  });
});

describe(accountEmailIndex, () => {
  it('indexes a +tag variant differently from the address', () => {
    expect(accountEmailIndex(MOCK_TAGGED_ADDRESS, MOCK_KEY_V1)).not.toBe(
      accountEmailIndex(MOCK_ADDRESS, MOCK_KEY_V1),
    );
  });
});
