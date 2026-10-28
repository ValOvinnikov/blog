import { getDb } from '@blog/db/client';
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
        byEmailAddress(address, membershipInvites.emailIndex),
        isNull(membershipInvites.consumedAt),
      ),
    );

  return withExactEmailAddress(candidates, address).map(({ row }) => row);
}
