import type { TMaybeNull, TNullable } from '@shinefold/config/types';
import type { TUser } from '@shinefold/db/schema/auth';
import {
  decryptOptionalPersonalValue,
  decryptPersonalValue,
  emailColumns,
  encryptPersonalValue,
} from '@shinefold/db/utils/personal-data/personal-data';
import { accountEmailIndex } from '@shinefold/utils/encryption';
import { isNull, isUndefined } from '@shinefold/utils/primitives';

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
  emailEncrypted = null,
  nameEncrypted = null,
}: Partial<Pick<TUser, 'emailEncrypted' | 'nameEncrypted'>>): {
  email: string;
  name: TMaybeNull<string>;
} {
  if (isNull(emailEncrypted)) throw new Error('User has no email.');

  return {
    email: decryptPersonalValue(emailEncrypted),
    name: decryptOptionalPersonalValue(nameEncrypted),
  };
}
