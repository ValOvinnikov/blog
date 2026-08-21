import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

// Deletes the `users` row for `userId` — the `/account` "delete account"
// action. Existing FK `onDelete: 'cascade'` on `accounts`, `sessions`
// (schema/auth.ts) and `bookmarks` (schema/bookmarks.ts) — all of which
// reference `users.id` — erases those rows automatically; no manual
// per-table deletes needed for what exists today.
//
// TODO: once comments exist, add a pre-delete tombstone step ahead of this
// call — a hard FK cascade would be wrong there, since a comment thread's
// shape must be preserved via soft-delete, not erased. Do not add a
// comments cascade or `onDelete` assumption here ahead of that (#1040).
//
// A no-op (not an error) if `userId` doesn't match a `users` row, matching
// this package's other delete-style mutations (see `removeBookmark`).
//
// Callers must pass the authenticated session's own user id here (never a
// client-supplied value) — this function performs no authorization check
// and deletes whatever account id it is given.
export async function deleteAccount(userId: string): Promise<void> {
  const db = getDb();

  await db.delete(users).where(eq(users.id, userId));
}
