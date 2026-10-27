import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { MOCK_USER_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { accountEmailIndex, personalDataIndex } from '@blog/utils/encryption';
import { faker } from '@faker-js/faker';

import {
  decryptPersonalValue,
  emailColumns,
  encryptPersonalValue,
  readOptionalPersonalValue,
  readPersonalValue,
  readReportedPersonalValue,
  reportPlainPersonalRead,
  requireEmailIndex,
} from './personal-data';

faker.seed(5765);

const MOCK_CIPHERTEXT = 'v1:ciphertext';
const MOCK_PLAIN_EMAIL = faker.internet.email().toLowerCase();

const fallbackListener = usePersonalDataFallbackListener();

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

  it('reads no value when neither form holds one', () => {
    expect(readOptionalPersonalValue(null, null)).toBeNull();
  });

  it('reads an encrypted value over the plain one and reports nothing', () => {
    const value = readReportedPersonalValue(
      PERSONAL_DATA_OWNER.USER,
      encryptPersonalValue(MOCK_USER_EMAIL),
      MOCK_PLAIN_EMAIL,
    );

    expect(value).toBe(MOCK_USER_EMAIL);
    expect(fallbackListener).not.toHaveBeenCalled();
  });

  it('reads the plain value of a row not yet encrypted and reports it', () => {
    const value = readReportedPersonalValue(
      PERSONAL_DATA_OWNER.USER,
      null,
      MOCK_PLAIN_EMAIL,
    );

    expect(value).toBe(MOCK_PLAIN_EMAIL);
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('reads no value and reports nothing when neither form holds one', () => {
    const value = readReportedPersonalValue(
      PERSONAL_DATA_OWNER.USER,
      null,
      null,
    );

    expect(value).toBeNull();
    expect(fallbackListener).not.toHaveBeenCalled();
  });

  it('reports a row not yet encrypted', () => {
    reportPlainPersonalRead(PERSONAL_DATA_OWNER.LEAD, null);

    expect(fallbackListener).toHaveBeenCalledWith({
      owner: PERSONAL_DATA_OWNER.LEAD,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('reports nothing for an encrypted row', () => {
    reportPlainPersonalRead(
      PERSONAL_DATA_OWNER.LEAD,
      encryptPersonalValue(MOCK_USER_EMAIL),
    );

    expect(fallbackListener).not.toHaveBeenCalled();
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

  it('reads the plain value of an encrypted row', () => {
    expect(readPersonalValue(MOCK_CIPHERTEXT, MOCK_USER_EMAIL)).toBe(
      MOCK_USER_EMAIL,
    );
  });

  it('reports the unset encryption key', () => {
    reportPlainPersonalRead(PERSONAL_DATA_OWNER.USER, MOCK_CIPHERTEXT);

    expect(fallbackListener).toHaveBeenCalledWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.ENCRYPTION_KEY_UNSET,
    });
  });

  it('refuses to decrypt', () => {
    expect(() => decryptPersonalValue(MOCK_USER_EMAIL)).toThrow(
      'PERSONAL_DATA_ENCRYPTION_KEY is not configured.',
    );
  });
});
