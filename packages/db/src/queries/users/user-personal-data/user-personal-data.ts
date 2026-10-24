import type { TMaybeNull, TNullable } from '@blog/config/types';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import type { TUser } from '@blog/db/schema/auth';
import {
  emailColumns,
  encryptPersonalValue,
  readOptionalPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
import { accountEmailIndex } from '@blog/utils/encryption';
import { isNull, isUndefined } from '@blog/utils/primitives';

type TUserPersonalColumns = Pick<
  TUser,
  'emailEncrypted' | 'emailIndex' | 'nameEncrypted'
>;

/** The encrypted and index columns for whichever of a user's email and name a write sets. */
export function userPersonalColumns({
  email,
  name,
}: {
  email?: string;
  name?: TNullable<string>;
}): Partial<TUserPersonalColumns> {
  return {
    ...(!isUndefined(email) && emailColumns(email, accountEmailIndex)),
    ...(!isUndefined(name) && {
      nameEncrypted: isNull(name) ? null : encryptPersonalValue(name),
    }),
  };
}

export function readUserPersonalData({
  email = null,
  name = null,
  emailEncrypted = null,
  nameEncrypted = null,
}: Partial<
  Pick<TUser, 'email' | 'name' | 'emailEncrypted' | 'nameEncrypted'>
>): {
  email: string;
  name: TMaybeNull<string>;
} {
  const readEmail = readOptionalPersonalValue(emailEncrypted, email);
  if (isNull(readEmail)) throw new Error('User has no email.');
  reportPlainPersonalRead(PERSONAL_DATA_OWNER.USER, emailEncrypted);

  return {
    email: readEmail,
    name: readOptionalPersonalValue(nameEncrypted, name),
  };
}
