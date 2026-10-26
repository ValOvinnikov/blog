import { getDb } from '@blog/db/client';
import type { TAccountProfileExport } from '@blog/db/queries/account/export-account-data';
import {
  getLinkedProviders,
  type TLinkedProviders,
} from '@blog/db/queries/account/get-linked-providers';
import { readUserPersonalData } from '@blog/db/queries/users/user-personal-data';
import { sessions, type TUser } from '@blog/db/schema/auth';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { tenants } from '@blog/db/schema/tenants';
import { and, asc, count, eq, gt } from 'drizzle-orm';

type TPersonalDataBookmark = {
  tenantId: string;
  tenantName: string;
  postId: string;
  createdAt: Date;
};

export type TPersonalDataReaderAccount = TAccountProfileExport & {
  linkedProviders: TLinkedProviders;
  activeSessionCount: number;
  bookmarks: TPersonalDataBookmark[];
};

export async function findReaderAccountPersonalData(
  user: TUser,
): Promise<TPersonalDataReaderAccount> {
  const db = getDb();
  const { id, emailVerified, image } = user;

  const [linkedProviders, [sessionCount], bookmarkRows] = await Promise.all([
    getLinkedProviders(id),
    db
      .select({ value: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, id), gt(sessions.expires, new Date()))),
    db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        postId: bookmarks.postId,
        createdAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .innerJoin(tenants, eq(tenants.id, bookmarks.tenantId))
      .where(eq(bookmarks.userId, id))
      .orderBy(asc(tenants.name), asc(bookmarks.createdAt)),
  ]);
  const { email, name } = readUserPersonalData(user);

  return {
    id,
    name: name ?? undefined,
    email,
    emailVerified: emailVerified ?? undefined,
    image: image ?? undefined,
    linkedProviders,
    activeSessionCount: sessionCount?.value ?? 0,
    bookmarks: bookmarkRows,
  };
}
