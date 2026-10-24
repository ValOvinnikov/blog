import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { bookmarks } from '@blog/db/schema/bookmarks';
import {
  readOptionalPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
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

function readOptional(
  encrypted: TMaybeNull<string>,
  plain: TMaybeNull<string>,
): TMaybeUndefined<string> {
  return readOptionalPersonalValue(encrypted, plain) ?? undefined;
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
      name: users.name,
      nameEncrypted: users.nameEncrypted,
      email: users.email,
      emailEncrypted: users.emailEncrypted,
      emailVerified: users.emailVerified,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return undefined;

  const {
    id,
    name,
    nameEncrypted,
    email,
    emailEncrypted,
    emailVerified,
    image,
  } = user;
  reportPlainPersonalRead(PERSONAL_DATA_OWNER.USER, emailEncrypted);

  const userBookmarks = await db
    .select({ postId: bookmarks.postId, createdAt: bookmarks.createdAt })
    .from(bookmarks)
    .where(and(eq(bookmarks.tenantId, tenantId), eq(bookmarks.userId, userId)))
    .orderBy(desc(bookmarks.createdAt));

  return {
    profile: {
      id,
      name: readOptional(nameEncrypted, name),
      email: readOptional(emailEncrypted, email),
      emailVerified: emailVerified ?? undefined,
      image: image ?? undefined,
    },
    bookmarks: userBookmarks,
  };
}
