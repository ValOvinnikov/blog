import type { TMaybeNull, TNullable } from '@blog/config/types';
import type { TUser } from '@blog/db/schema/auth';
import {
  emailColumns,
  decryptPersonalValue,
  encryptPersonalValue,
  requireDecryptedPersonalValue,
} from '@blog/db/utils/personal-data/personal-data';
import { accountEmailIndex } from '@blog/utils/encryption';
import { isUndefined } from '@blog/utils/primitives';

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
      nameEncrypted: name === null ? null : encryptPersonalValue(name),
    }),
  };
}

export function readUserPersonalData({
  emailEncrypted = null,
  nameEncrypted = null,
}: Partial<Pick<TUser, 'emailEncrypted' | 'nameEncrypted'>>): {
  email: string;
  name: TMaybeNull<string>;
} {
  return {
    email: requireDecryptedPersonalValue(emailEncrypted, 'User'),
    name: nameEncrypted === null ? null : decryptPersonalValue(nameEncrypted),
  };
}
