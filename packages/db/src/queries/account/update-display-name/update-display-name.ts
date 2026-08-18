import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

// Updates the `users.name` column — the `/account` hub's display-name edit
// action (Epic #1159). Any signed-in user may rename themselves; `name` has
// no uniqueness or format constraint beyond the schema's free-text nullable
// column, so this needs no guard beyond `userId` matching a row.
//
// A no-op if `userId` doesn't match a `users` row, matching this package's
// other update/delete-style mutations (see `deleteAccount`).
//
// Callers must pass the authenticated session's own user id here (never a
// client-supplied value) — this function performs no authorization check
// and renames whatever account it is given.
export async function updateDisplayName(
  userId: string,
  name: string,
): Promise<void> {
  const db = getDb();

  await db.update(users).set({ name }).where(eq(users.id, userId));
}
