import { MOCK_USER_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
} from '@blog/db/testing/personal-data';
import { accountEmailIndex, personalDataIndex } from '@blog/utils/encryption';

import {
  decryptOptionalPersonalValue,
  decryptPersonalValue,
  emailColumns,
  encryptPersonalValue,
  requireEmailIndex,
  uniqueEmailColumns,
} from './personal-data';

const ENCRYPTION_KEY_MISSING =
  'PERSONAL_DATA_ENCRYPTION_KEY is not configured.';

const INDEXERS = [
  {
    kind: 'personal data',
    indexer: personalDataIndex,
    index: testPersonalEmailIndex,
  },
  {
    kind: 'account',
    indexer: accountEmailIndex,
    index: mockAccountEmailIndex,
  },
];

describe('with both personal data keys configured', () => {
  it('encrypts a value so only the keyring reads it back', () => {
    const encrypted = encryptPersonalValue(MOCK_USER_EMAIL);

    expect(encrypted).not.toContain(MOCK_USER_EMAIL);
    expect(decryptTestPersonalValue(encrypted)).toBe(MOCK_USER_EMAIL);
  });

  it('decrypts a value it encrypted', () => {
    expect(decryptPersonalValue(encryptPersonalValue(MOCK_USER_EMAIL))).toBe(
      MOCK_USER_EMAIL,
    );
  });

  it('decrypts an optional value it encrypted', () => {
    expect(
      decryptOptionalPersonalValue(encryptPersonalValue(MOCK_USER_EMAIL)),
    ).toBe(MOCK_USER_EMAIL);
  });

  it('reads no optional value when none is stored', () => {
    expect(decryptOptionalPersonalValue(null)).toBeNull();
  });

  it.each(INDEXERS)(
    'gives an email its encrypted form and $kind index',
    ({ indexer, index }) => {
      const { emailEncrypted, emailIndex } = emailColumns(
        MOCK_USER_EMAIL,
        indexer,
      );

      expect(decryptTestPersonalValue(emailEncrypted)).toBe(MOCK_USER_EMAIL);
      expect(emailIndex).toBe(index(MOCK_USER_EMAIL));
    },
  );

  it('gives an email unique per exact address both indexes', () => {
    const { emailEncrypted, emailIndex, emailExactIndex } =
      uniqueEmailColumns(MOCK_USER_EMAIL);

    expect(decryptTestPersonalValue(emailEncrypted)).toBe(MOCK_USER_EMAIL);
    expect(emailIndex).toBe(testPersonalEmailIndex(MOCK_USER_EMAIL));
    expect(emailExactIndex).toBe(mockAccountEmailIndex(MOCK_USER_EMAIL));
  });

  it.each(INDEXERS)(
    'indexes an email for lookup with the $kind index',
    ({ indexer, index }) => {
      expect(requireEmailIndex(MOCK_USER_EMAIL, indexer)).toBe(
        index(MOCK_USER_EMAIL),
      );
    },
  );
});

describe('with no personal data keys configured', () => {
  beforeEach(() => {
    vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', undefined);
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);
  });

  it('refuses to encrypt', () => {
    expect(() => encryptPersonalValue(MOCK_USER_EMAIL)).toThrow(
      ENCRYPTION_KEY_MISSING,
    );
  });

  it('refuses to decrypt', () => {
    expect(() => decryptPersonalValue(MOCK_USER_EMAIL)).toThrow(
      ENCRYPTION_KEY_MISSING,
    );
  });

  it('refuses an index lookup', () => {
    expect(() => requireEmailIndex(MOCK_USER_EMAIL, personalDataIndex)).toThrow(
      'PERSONAL_DATA_INDEX_KEY is not configured.',
    );
  });
});
