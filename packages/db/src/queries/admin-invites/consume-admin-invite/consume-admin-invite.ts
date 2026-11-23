import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { GRANTED_VIA } from '@shinefold/db/constants';
import { inviteEmailColumns } from '@shinefold/db/queries/membership-invites/invite-email-columns';
import { adminInvites } from '@shinefold/db/schema/admin-invites';
import { admins, type TAdmin } from '@shinefold/db/schema/admins';
import {
  castTo,
  columnDefault,
} from '@shinefold/db/utils/insert-select-columns/insert-select-columns';
import { and, eq, gt, sql } from 'drizzle-orm';

// One statement, because `neon-http` has no transactions: the invite goes only with the admin row it grants, and a user already an admin just loses the stale invite.
export async function consumeAdminInvite(
  email: string,
  userId: string,
): Promise<TMaybeUndefined<TAdmin>> {
  const db = getDb();
  const { emailExactIndex } = inviteEmailColumns(email);

  const claimed = db.$with('claimed_admin_invite').as(
    db
      .delete(adminInvites)
      .where(
        and(
          eq(adminInvites.emailExactIndex, emailExactIndex),
          gt(adminInvites.expiresAt, new Date()),
        ),
      )
      .returning({
        role: adminInvites.role,
        invitedBy: adminInvites.invitedBy,
      }),
  );

  const [admin] = await db
    .with(claimed)
    .insert(admins)
    .select(
      db
        .select({
          id: columnDefault(admins.id),
          userId: castTo(admins.userId, sql`${userId}`),
          role: sql`${claimed.role}`.as(admins.role.name),
          grantedBy: sql`${claimed.invitedBy}`.as(admins.grantedBy.name),
          grantedVia: castTo(admins.grantedVia, sql`${GRANTED_VIA.INVITE}`),
          grantedAt: columnDefault(admins.grantedAt),
          createdAt: columnDefault(admins.createdAt),
        })
        .from(claimed),
    )
    .onConflictDoNothing()
    .returning();

  return admin;
}
