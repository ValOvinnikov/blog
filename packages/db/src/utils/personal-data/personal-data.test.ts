import { MOCK_USER_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { accountEmailIndex, personalDataIndex } from '@blog/utils/encryption';

import {
  decryptPersonalValue,
  emailColumns,
  encryptPersonalValue,
  readPersonalValue,
  requireEmailIndex,
} from './personal-data';

describe('with both personal data keys configured', () => {
  usePersonalDataKeys();

  it('encrypts a value so only the keyring reads it back', () => {
    const encrypted = encryptPersonalValue(MOCK_USER_EMAIL);

    expect(encrypted).not.toContain(MOCK_USER_EMAIL);
    expect(decryptTestPersonalValue(encrypted)).toBe(MOCK_USER_EMAIL);
  });

  it('decrypts a value it encrypted', () => {
    const encrypted = encryptPersonalValue(MOCK_USER_EMAIL) ?? '';

    expect(decryptPersonalValue(encrypted)).toBe(MOCK_USER_EMAIL);
  });

  it.each([
    [personalDataIndex, testPersonalEmailIndex],
    [accountEmailIndex, mockAccountEmailIndex],
  ])('%o gives an email its encrypted form and its index', (indexer, index) => {
    const { emailEncrypted, emailIndex } = emailColumns(
      MOCK_USER_EMAIL,
      indexer,
    );

    expect(decryptTestPersonalValue(emailEncrypted)).toBe(MOCK_USER_EMAIL);
    expect(emailIndex).toBe(index(MOCK_USER_EMAIL));
  });

  it('reads an encrypted value back', () => {
    expect(readPersonalValue(encryptPersonalValue(MOCK_USER_EMAIL), '')).toBe(
      MOCK_USER_EMAIL,
    );
  });

  it('reads the plain value of a row not yet encrypted', () => {
    expect(readPersonalValue(null, MOCK_USER_EMAIL)).toBe(MOCK_USER_EMAIL);
  });

  it.each([
    [personalDataIndex, testPersonalEmailIndex],
    [accountEmailIndex, mockAccountEmailIndex],
  ])('%o indexes an email for lookup', (indexer, index) => {
    expect(requireEmailIndex(MOCK_USER_EMAIL, indexer)).toBe(
      index(MOCK_USER_EMAIL),
    );
  });
});

describe('with no personal data keys configured', () => {
  beforeEach(() => {
    vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', undefined);
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('leaves the encrypted and index forms empty', () => {
    expect(emailColumns(MOCK_USER_EMAIL, personalDataIndex)).toEqual({
      emailEncrypted: null,
      emailIndex: null,
    });
  });

  it('refuses an index lookup', () => {
    expect(() => requireEmailIndex(MOCK_USER_EMAIL, personalDataIndex)).toThrow(
      'PERSONAL_DATA_INDEX_KEY is not configured.',
    );
  });

  it('refuses to decrypt', () => {
    expect(() => decryptPersonalValue(MOCK_USER_EMAIL)).toThrow(
      'PERSONAL_DATA_ENCRYPTION_KEY is not configured.',
    );
  });
});
