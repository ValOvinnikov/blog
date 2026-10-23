import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { admins } from '@blog/db/schema/admins';
import { auditEvents } from '@blog/db/schema/audit-events';
import { users } from '@blog/db/schema/auth';
import { memberships } from '@blog/db/schema/memberships';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, exists, not } from 'drizzle-orm';

// TODO: once comments exist, tombstone them ahead of this delete — a comment
// thread must be soft-deleted, not erased by an FK cascade (#1040).

function holdsNoPlatformRole(userId: string) {
  const db = getDb();

  return and(
    not(
      exists(
        db
          .select({ id: memberships.id })
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, userId),
              eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
            ),
          ),
      ),
    ),
    not(
      exists(
        db
          .select({ id: admins.id })
          .from(admins)
          .where(eq(admins.userId, userId)),
      ),
    ),
  );
}

// Refuses an owner or platform admin: the cascade would orphan their tenant or
// the platform. Performs no authorization — pass the session's own user id.
// Audit rows outlive the account; only their email snapshot is cleared, before
// the delete, so a retry after a failed delete still finishes both.
export async function deleteAccount(
  userId: string,
): Promise<TResult<void, TErrorCode>> {
  const db = getDb();

  await db
    .update(auditEvents)
    .set({ actorEmail: null })
    .where(and(eq(auditEvents.actorId, userId), holdsNoPlatformRole(userId)));

  const deletedRows = await db
    .delete(users)
    .where(and(eq(users.id, userId), holdsNoPlatformRole(userId)))
    .returning({ id: users.id });

  if (deletedRows.length === 0) {
    const [remaining] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (remaining) return errorResult(ERROR_CODE.DB_HOLDS_PLATFORM_ROLE);
  }

  return okResult();
}
