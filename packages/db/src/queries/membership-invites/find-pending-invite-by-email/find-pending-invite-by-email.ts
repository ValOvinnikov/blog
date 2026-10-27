import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import {
  byEmailAddress,
  withExactEmailAddress,
} from '@blog/db/utils/personal-data/email-address-match';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, isNull } from 'drizzle-orm';

export async function findPendingInviteByEmail(
  email: string,
): Promise<TMembershipInvite[]> {
  const address = normalizeEmail(email);
  const candidates = await getDb()
    .select()
    .from(membershipInvites)
    .where(
      and(
        byEmailAddress(address, {
          index: membershipInvites.emailIndex,
          plain: membershipInvites.email,
          owner: PERSONAL_DATA_OWNER.INVITE,
        }),
        isNull(membershipInvites.consumedAt),
      ),
    );

  return withExactEmailAddress(
    candidates,
    address,
    PERSONAL_DATA_OWNER.INVITE,
  ).map(({ row }) => row);
}
