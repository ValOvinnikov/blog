import type { TMaybeNull, TNullable } from '@blog/config/types';
import type { TUser } from '@blog/db/schema/auth';
import {
  decryptPersonalValue,
  encryptPersonalValue,
  personalEmailColumns,
} from '@blog/db/utils/personal-data/personal-data';

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
    ...(email !== undefined && personalEmailColumns(email)),
    ...(name !== undefined && {
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
  if (emailEncrypted === null) throw new Error('User has no encrypted email.');

  return {
    email: decryptPersonalValue(emailEncrypted),
    name: nameEncrypted === null ? null : decryptPersonalValue(nameEncrypted),
  };
}
