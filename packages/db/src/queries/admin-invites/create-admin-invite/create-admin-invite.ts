import { getDb } from '@shinefold/db/client';
import {
  ADMIN_INVITE_LIFETIME_DAYS,
  ADMIN_INVITE_OUTCOME,
  type TAdminRole,
} from '@shinefold/db/constants';
import { inviteEmailColumns } from '@shinefold/db/queries/membership-invites/invite-email-columns';
import {
  adminInvites,
  type TAdminInvite,
} from '@shinefold/db/schema/admin-invites';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';
import { eq } from 'drizzle-orm';

export type TCreateAdminInviteResult =
  | { outcome: typeof ADMIN_INVITE_OUTCOME.INVITED; invite: TAdminInvite }
  | { outcome: typeof ADMIN_INVITE_OUTCOME.ALREADY_ADMIN };

async function isAdminAddress(emailExactIndex: string): Promise<boolean> {
  const [admin] = await getDb()
    .select({ id: admins.id })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .where(eq(users.emailIndex, emailExactIndex));

  return Boolean(admin);
}

export async function createAdminInvite(
  email: string,
  role: TAdminRole,
  invitedBy: string,
): Promise<TCreateAdminInviteResult> {
  const emailColumns = inviteEmailColumns(email);

  if (await isAdminAddress(emailColumns.emailExactIndex)) {
    return { outcome: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN };
  }

  const createdAt = new Date();
  const renewal = {
    role,
    invitedBy,
    createdAt,
    expiresAt: daysAfter(createdAt, ADMIN_INVITE_LIFETIME_DAYS),
  };

  const [invite] = await getDb()
    .insert(adminInvites)
    .values({ ...emailColumns, ...renewal })
    .onConflictDoUpdate({
      target: adminInvites.emailExactIndex,
      set: { ...renewal, emailEncrypted: emailColumns.emailEncrypted },
    })
    .returning();

  if (!invite) {
    throw new Error('createAdminInvite: the upsert returned no row.');
  }

  return { outcome: ADMIN_INVITE_OUTCOME.INVITED, invite };
}
