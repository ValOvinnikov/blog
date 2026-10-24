import type { TMaybeUndefined } from '@blog/config/types';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { getUserByEmail } from '@blog/db/queries/users/get-user-by-email/get-user-by-email';
import { getUsersByEmailIndex } from '@blog/db/queries/users/get-users-by-email-index/get-users-by-email-index';
import type { TUser } from '@blog/db/schema/auth';
import {
  isEmailIndexConfigured,
  readPersonalValue,
} from '@blog/db/utils/personal-data/personal-data';
import { notifyPersonalDataFallback } from '@blog/db/utils/personal-data/personal-data-fallback';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';

// The index ignores a `+tag`, so only a candidate whose own address matches is the user.
async function findIndexedUser(email: string): Promise<TMaybeUndefined<TUser>> {
  const requested = normalizeEmail(email);
  const candidates = await getUsersByEmailIndex(email);

  return candidates.find(
    ({ email: plain, emailEncrypted }) =>
      emailEncrypted !== null &&
      normalizeEmail(readPersonalValue(emailEncrypted, plain ?? '')) ===
        requested,
  );
}

export async function findUserByEmail(
  email: string,
): Promise<TMaybeUndefined<TUser>> {
  if (isEmailIndexConfigured()) {
    const indexed = await findIndexedUser(email);
    if (indexed) return indexed;
  } else {
    notifyPersonalDataFallback({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.INDEX_KEY_UNSET,
    });
  }

  return getUserByEmail(email);
}
