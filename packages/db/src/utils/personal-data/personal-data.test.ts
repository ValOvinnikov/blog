import { MOCK_USER_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';

import {
  accountEmailColumns,
  decryptPersonalValue,
  encryptPersonalValue,
  personalEmailColumns,
  readPersonalValue,
  requireAccountEmailIndex,
  requirePersonalEmailIndex,
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
    [personalEmailColumns, testPersonalEmailIndex],
    [accountEmailColumns, testAccountEmailIndex],
  ])('%o gives an email its encrypted form and its index', (columns, index) => {
    const { emailEncrypted, emailIndex } = columns(MOCK_USER_EMAIL);

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
    [requirePersonalEmailIndex, testPersonalEmailIndex],
    [requireAccountEmailIndex, testAccountEmailIndex],
  ])('%o indexes an email for lookup', (requireIndex, index) => {
    expect(requireIndex(MOCK_USER_EMAIL)).toBe(index(MOCK_USER_EMAIL));
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
    expect(personalEmailColumns(MOCK_USER_EMAIL)).toEqual({
      emailEncrypted: null,
      emailIndex: null,
    });
  });

  it('refuses an index lookup', () => {
    expect(() => requirePersonalEmailIndex(MOCK_USER_EMAIL)).toThrow(
      'PERSONAL_DATA_INDEX_KEY is not configured.',
    );
  });

  it('refuses to decrypt', () => {
    expect(() => decryptPersonalValue(MOCK_USER_EMAIL)).toThrow(
      'PERSONAL_DATA_ENCRYPTION_KEY is not configured.',
    );
  });
});
