import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
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
export async function deleteAccount(
  userId: string,
): Promise<TResult<void, TErrorCode>> {
  const db = getDb();

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
