import { getDb } from '@blog/db/client';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import { requirePersonalEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { and, eq, isNull } from 'drizzle-orm';

export async function findPendingInviteByEmailIndex(
  email: string,
): Promise<TMembershipInvite[]> {
  return getDb()
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.emailIndex, requirePersonalEmailIndex(email)),
        isNull(membershipInvites.consumedAt),
      ),
    );
}
