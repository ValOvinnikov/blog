import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { personalEmailColumns } from '@blog/db/utils/personal-data/personal-data';

export type TDraftOwner =
  { type: 'user'; userId: string } | { type: 'invite'; email: string };

export async function insertDraftOwner(
  tenantId: string,
  owner: TDraftOwner,
): Promise<unknown[]> {
  const db = getDb();

  if (owner.type === 'user') {
    return db
      .insert(memberships)
      .values({ tenantId, userId: owner.userId, role: MEMBERSHIP_ROLE.OWNER })
      .returning();
  }

  const email = normalizeEmail(owner.email);
  return db
    .insert(membershipInvites)
    .values({
      tenantId,
      email,
      ...personalEmailColumns(email),
      role: MEMBERSHIP_ROLE.OWNER,
    })
    .returning();
}
