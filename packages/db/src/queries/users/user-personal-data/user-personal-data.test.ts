import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { MOCK_USER_EMAIL, MOCK_USER_NAME } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';

import {
  readUserPersonalData,
  userPersonalColumns,
} from './user-personal-data';

usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

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

  it('reads a user not yet backfilled from the plain columns and reports it', () => {
    expect(
      readUserPersonalData({
        email: MOCK_USER_EMAIL,
        name: MOCK_USER_NAME,
        emailEncrypted: null,
        nameEncrypted: null,
      }),
    ).toEqual({ email: MOCK_USER_EMAIL, name: MOCK_USER_NAME });
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('reads the plain columns when the encryption key is unset', () => {
    const { emailEncrypted = null, nameEncrypted = null } = userPersonalColumns(
      { email: MOCK_USER_EMAIL, name: MOCK_USER_NAME },
    );
    vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', undefined);

    expect(
      readUserPersonalData({
        email: MOCK_USER_EMAIL,
        name: MOCK_USER_NAME,
        emailEncrypted,
        nameEncrypted,
      }),
    ).toEqual({ email: MOCK_USER_EMAIL, name: MOCK_USER_NAME });
  });

  it('reports nothing for a backfilled user', () => {
    const { emailEncrypted = null } = userPersonalColumns({
      email: MOCK_USER_EMAIL,
    });

    readUserPersonalData({ emailEncrypted, nameEncrypted: null });

    expect(fallbackListener).not.toHaveBeenCalled();
  });

  it('refuses a user with no email in either form', () => {
    expect(() =>
      readUserPersonalData({ emailEncrypted: null, nameEncrypted: null }),
    ).toThrow();
  });
});
