import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { and, desc, eq } from 'drizzle-orm';

// The `/account` "export my data" download's profile slice — the raw
// `users` row's nullable fields (name/email/emailVerified/image can all be
// unset, e.g. a fresh OAuth sign-in before a provider returns them) mapped
// to `undefined` rather than leaking Drizzle's `null`, per this package's
// no-faked-defaults convention.
export type TAccountProfileExport = {
  id: string;
  name: string | undefined;
  email: string | undefined;
  emailVerified: Date | undefined;
  image: string | undefined;
};

// One bookmarked post in the export. `userId` is intentionally omitted here
// (it's implicit — every row in this array belongs to the exported user).
export type TAccountBookmarkExport = {
  postId: string;
  createdAt: Date;
};

export type TAccountDataExport = {
  profile: TAccountProfileExport;
  bookmarks: TAccountBookmarkExport[];
};

// Aggregates a user's profile + bookmarks into one JSON-serializable shape
// for the `/account` "export my data" download. Scoped to the two tables
// that exist today (`users`, `bookmarks`).
//
// TODO: extend this function to fold in comments and ratings once each
// lands; don't add those tables ahead of that (#1040, #1041).
//
// `bookmarks` carries a `tenantId`, so the export is scoped to the tenant
// the "export my data" action was invoked from, not every tenant the user
// holds membership in — matching queries/bookmarks/'s tenant-scoping
// convention.
//
// Returns `undefined` if `userId` doesn't match a `users` row, rather than a
// half-empty export shape — callers (web) should treat that as "no such
// account", not "an account with nothing in it".
//
// Callers must pass the authenticated session's own user id here (never a
// client-supplied value) — this function performs no authorization check
// and returns whatever account's data it is given.
export async function exportAccountData(
  tenantId: string,
  userId: string,
): Promise<TAccountDataExport | undefined> {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) return undefined;

  const userBookmarks = await db
    .select({ postId: bookmarks.postId, createdAt: bookmarks.createdAt })
    .from(bookmarks)
    .where(and(eq(bookmarks.tenantId, tenantId), eq(bookmarks.userId, userId)))
    .orderBy(desc(bookmarks.createdAt));

  return {
    profile: {
      id: user.id,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      emailVerified: user.emailVerified ?? undefined,
      image: user.image ?? undefined,
    },
    bookmarks: userBookmarks,
  };
}
