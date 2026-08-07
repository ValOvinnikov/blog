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
export async function updateDisplayName(
  userId: string,
  name: string,
): Promise<void> {
  const db = getDb();

  await db.update(users).set({ name }).where(eq(users.id, userId));
}
