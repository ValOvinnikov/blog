import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import { memberships } from '@blog/db/schema/memberships';
import type { TResult } from '@blog/utils';
import { and, eq, exists, not } from 'drizzle-orm';

// TODO: once comments exist, tombstone them ahead of this delete — a comment
// thread must be soft-deleted, not erased by an FK cascade (#1040).

// Refuses an owner or platform admin: the cascade would orphan their tenant or
// the platform. Performs no authorization — pass the session's own user id.
export async function deleteAccount(
  userId: string,
): Promise<TResult<void, TErrorCode>> {
  const db = getDb();

  const deletedRows = await db
    .delete(users)
    .where(
      and(
        eq(users.id, userId),
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
      ),
    )
    .returning({ id: users.id });

  if (deletedRows.length > 0) return { ok: true, data: undefined };

  const [remaining] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));

  return remaining
    ? { ok: false, error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE }
    : { ok: true, data: undefined };
}
