import type { TMaybeUndefined } from '@blog/config/types';
import { getUsersByEmailIndex } from '@blog/db/queries/users/get-users-by-email-index/get-users-by-email-index';
import type { TUser } from '@blog/db/schema/auth';
import { decryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { isNull } from '@blog/utils/primitives';

export async function findUserByEmail(
  email: string,
): Promise<TMaybeUndefined<TUser>> {
  const requested = normalizeEmail(email);
  const candidates = await getUsersByEmailIndex(email);

  return candidates.find(
    ({ emailEncrypted }) =>
      !isNull(emailEncrypted) &&
      normalizeEmail(decryptPersonalValue(emailEncrypted)) === requested,
  );
}
