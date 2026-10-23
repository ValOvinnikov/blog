import type { TMaybeNull } from '@blog/config/types';
import {
  decryptTestPersonalValue,
  testAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { faker } from '@faker-js/faker';

import {
  accountEmailColumns,
  decryptPersonalValue,
  encryptPersonalValue,
  personalEmailColumns,
  readPersonalValue,
  requireAccountEmailIndex,
  requirePersonalEmailIndex,
} from './personal-data';

const EMAIL = faker.internet.email().toLowerCase();

describe('with both personal data keys configured', () => {
  usePersonalDataKeys();

  it('encrypts a value so only the keyring reads it back', () => {
    const encrypted = encryptPersonalValue(EMAIL) ?? '';

    expect(encrypted).not.toContain(EMAIL);
    expect(decryptPersonalValue(encrypted)).toBe(EMAIL);
  });

  it.each<[string, () => TMaybeNull<string>, string]>([
    ['an encrypted value', () => encryptPersonalValue(EMAIL), ''],
    ['the plain value of a row not yet encrypted', () => null, EMAIL],
  ])('reads %s', (_label, encrypted, plain) => {
    expect(readPersonalValue(encrypted(), plain)).toBe(EMAIL);
  });

  it.each([
    ['personal', personalEmailColumns, testPersonalEmailIndex],
    ['account', accountEmailColumns, testAccountEmailIndex],
  ])(
    'gives a %s email its encrypted form and its index',
    (_kind, columns, index) => {
      const { emailEncrypted, emailIndex } = columns(EMAIL);

      expect(decryptTestPersonalValue(emailEncrypted)).toBe(EMAIL);
      expect(emailIndex).toBe(index(EMAIL));
    },
  );

  it.each([
    [requirePersonalEmailIndex, testPersonalEmailIndex],
    [requireAccountEmailIndex, testAccountEmailIndex],
  ])('%o indexes an email for lookup', (requireIndex, index) => {
    expect(requireIndex(EMAIL)).toBe(index(EMAIL));
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
