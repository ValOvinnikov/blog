import type { TMaybeUndefined } from '@shinefold/config/types';
import { getUsersByEmailIndex } from '@shinefold/db/queries/users/get-users-by-email-index/get-users-by-email-index';
import type { TUser } from '@shinefold/db/schema/auth';
import { decryptPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@shinefold/utils/normalize-email-identity';
import { isNull } from '@shinefold/utils/primitives';

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
