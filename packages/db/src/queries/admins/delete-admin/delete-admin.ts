import { getDb } from '@shinefold/db/client';
import {
  ADMIN_REMOVAL_OUTCOME,
  ADMIN_ROLE,
  type TAdminRemovalOutcome,
} from '@shinefold/db/constants';
import { admins } from '@shinefold/db/schema/admins';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, exists, ne, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

function keepsAnotherSuperadmin() {
  const otherSuperadmin = alias(admins, 'other_superadmin');

  return or(
    ne(admins.role, ADMIN_ROLE.SUPERADMIN),
    exists(
      getDb()
        .select({ id: otherSuperadmin.id })
        .from(otherSuperadmin)
        .where(
          and(
            eq(otherSuperadmin.role, ADMIN_ROLE.SUPERADMIN),
            ne(otherSuperadmin.id, admins.id),
          ),
        ),
    ),
  );
}

export async function deleteAdmin(
  adminId: string,
): Promise<TAdminRemovalOutcome> {
  if (!isUuid(adminId)) return ADMIN_REMOVAL_OUTCOME.NOT_FOUND;

  const db = getDb();
  const removed = await db
    .delete(admins)
    .where(and(eq(admins.id, adminId), keepsAnotherSuperadmin()))
    .returning({ id: admins.id });

  if (hasLength(removed)) return ADMIN_REMOVAL_OUTCOME.REMOVED;

  const [kept] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, adminId));

  return kept
    ? ADMIN_REMOVAL_OUTCOME.LAST_SUPERADMIN
    : ADMIN_REMOVAL_OUTCOME.NOT_FOUND;
}
