import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { decryptOptionalPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { and, desc, eq } from 'drizzle-orm';

export type TAccountProfileExport = {
  id: string;
  name: TMaybeUndefined<string>;
  email: TMaybeUndefined<string>;
  emailVerified: TMaybeUndefined<Date>;
  image: TMaybeUndefined<string>;
};

export type TAccountBookmarkExport = {
  postId: string;
  createdAt: Date;
};

export type TAccountDataExport = {
  profile: TAccountProfileExport;
  bookmarks: TAccountBookmarkExport[];
};

function readOptional(encrypted: TMaybeNull<string>): TMaybeUndefined<string> {
  return decryptOptionalPersonalValue(encrypted) ?? undefined;
}

// TODO: fold in comments and ratings once each lands (#1040, #1041).
// Performs no authorization check: pass the session's own user id.
export async function exportAccountData(
  tenantId: string,
  userId: string,
): Promise<TMaybeUndefined<TAccountDataExport>> {
  const db = getDb();

  const [user] = await db
    .select({
      id: users.id,
      nameEncrypted: users.nameEncrypted,
      emailEncrypted: users.emailEncrypted,
      emailVerified: users.emailVerified,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return undefined;

  const { id, nameEncrypted, emailEncrypted, emailVerified, image } = user;

  const userBookmarks = await db
    .select({ postId: bookmarks.postId, createdAt: bookmarks.createdAt })
    .from(bookmarks)
    .where(and(eq(bookmarks.tenantId, tenantId), eq(bookmarks.userId, userId)))
    .orderBy(desc(bookmarks.createdAt));

  return {
    profile: {
      id,
      name: readOptional(nameEncrypted),
      email: readOptional(emailEncrypted),
      emailVerified: emailVerified ?? undefined,
      image: image ?? undefined,
    },
    bookmarks: userBookmarks,
  };
}
