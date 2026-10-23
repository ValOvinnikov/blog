import { MOCK_USER_EMAIL, MOCK_USER_NAME } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';

import {
  readUserPersonalData,
  userPersonalColumns,
} from './user-personal-data';

usePersonalDataKeys();

describe(userPersonalColumns, () => {
  it('encrypts and indexes the email and encrypts the name', () => {
    const { emailEncrypted, emailIndex, nameEncrypted } = userPersonalColumns({
      email: MOCK_USER_EMAIL,
      name: MOCK_USER_NAME,
    });

    expect(decryptTestPersonalValue(emailEncrypted ?? null)).toBe(
      MOCK_USER_EMAIL,
    );
    expect(emailIndex).toBe(testPersonalEmailIndex(MOCK_USER_EMAIL));
    expect(decryptTestPersonalValue(nameEncrypted ?? null)).toBe(
      MOCK_USER_NAME,
    );
  });

  it('clears the encrypted name when the name is cleared', () => {
    expect(userPersonalColumns({ name: null })).toEqual({
      nameEncrypted: null,
    });
  });

  it('writes nothing for fields the write leaves alone', () => {
    expect(userPersonalColumns({})).toEqual({});
  });
});

describe(readUserPersonalData, () => {
  it('reads back the email and name it was given', () => {
    const { emailEncrypted = null, nameEncrypted = null } = userPersonalColumns(
      { email: MOCK_USER_EMAIL, name: MOCK_USER_NAME },
    );

    expect(readUserPersonalData({ emailEncrypted, nameEncrypted })).toEqual({
      email: MOCK_USER_EMAIL,
      name: MOCK_USER_NAME,
    });
  });

  it('reads a user without a name as nameless', () => {
    const { emailEncrypted = null } = userPersonalColumns({
      email: MOCK_USER_EMAIL,
    });

    expect(
      readUserPersonalData({ emailEncrypted, nameEncrypted: null }),
    ).toEqual({ email: MOCK_USER_EMAIL, name: null });
  });

  it('refuses a user without an encrypted email', () => {
    expect(() =>
      readUserPersonalData({ emailEncrypted: null, nameEncrypted: null }),
    ).toThrow();
  });
});
