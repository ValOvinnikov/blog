import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { faker } from '@faker-js/faker';

import {
  decryptPersonalValue,
  encryptPersonalValue,
  personalEmailColumns,
  readPersonalValue,
  requirePersonalEmailIndex,
} from './personal-data';

const EMAIL = faker.internet.email().toLowerCase();

describe('with both personal data keys configured', () => {
  usePersonalDataKeys();

  it('encrypts a value so only the keyring reads it back', () => {
    const encrypted = encryptPersonalValue(EMAIL);

    expect(encrypted).not.toContain(EMAIL);
    expect(decryptTestPersonalValue(encrypted)).toBe(EMAIL);
  });

  it('decrypts a value it encrypted', () => {
    const encrypted = encryptPersonalValue(EMAIL) ?? '';

    expect(decryptPersonalValue(encrypted)).toBe(EMAIL);
  });

  it('gives an email its encrypted form and its index', () => {
    const { emailEncrypted, emailIndex } = personalEmailColumns(EMAIL);

    expect(decryptTestPersonalValue(emailEncrypted)).toBe(EMAIL);
    expect(emailIndex).toBe(testPersonalEmailIndex(EMAIL));
  });

  it('reads an encrypted value back', () => {
    expect(readPersonalValue(encryptPersonalValue(EMAIL), '')).toBe(EMAIL);
  });

  it('reads the plain value of a row not yet encrypted', () => {
    expect(readPersonalValue(null, EMAIL)).toBe(EMAIL);
  });

  it('indexes an email for lookup', () => {
    expect(requirePersonalEmailIndex(EMAIL)).toBe(
      testPersonalEmailIndex(EMAIL),
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
    expect(personalEmailColumns(EMAIL)).toEqual({
      emailEncrypted: null,
      emailIndex: null,
    });
  });

  it('refuses an index lookup', () => {
    expect(() => requirePersonalEmailIndex(EMAIL)).toThrow(
      'PERSONAL_DATA_INDEX_KEY is not configured.',
    );
  });

  it('refuses to decrypt', () => {
    expect(() => decryptPersonalValue(EMAIL)).toThrow(
      'PERSONAL_DATA_ENCRYPTION_KEY is not configured.',
    );
  });
});
