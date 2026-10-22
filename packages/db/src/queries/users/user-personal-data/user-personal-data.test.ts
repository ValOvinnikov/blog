import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { faker } from '@faker-js/faker';

import {
  readUserPersonalData,
  userPersonalColumns,
} from './user-personal-data';

const EMAIL = faker.internet.email().toLowerCase();
const NAME = faker.person.fullName();

usePersonalDataKeys();

describe(userPersonalColumns, () => {
  it('encrypts and indexes the email and encrypts the name', () => {
    const { emailEncrypted, emailIndex, nameEncrypted } = userPersonalColumns({
      email: EMAIL,
      name: NAME,
    });

    expect(decryptTestPersonalValue(emailEncrypted ?? null)).toBe(EMAIL);
    expect(emailIndex).toBe(testPersonalEmailIndex(EMAIL));
    expect(decryptTestPersonalValue(nameEncrypted ?? null)).toBe(NAME);
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
      { email: EMAIL, name: NAME },
    );

    expect(readUserPersonalData({ emailEncrypted, nameEncrypted })).toEqual({
      email: EMAIL,
      name: NAME,
    });
  });

  it('reads a user without a name as nameless', () => {
    const { emailEncrypted = null } = userPersonalColumns({ email: EMAIL });

    expect(
      readUserPersonalData({ emailEncrypted, nameEncrypted: null }),
    ).toEqual({ email: EMAIL, name: null });
  });

  it('refuses a user without an encrypted email', () => {
    expect(() =>
      readUserPersonalData({ emailEncrypted: null, nameEncrypted: null }),
    ).toThrow();
  });
});
