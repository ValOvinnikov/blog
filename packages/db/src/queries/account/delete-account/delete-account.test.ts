import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  ADMIN_ROLE,
  GRANTED_VIA,
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { deleteAccount } from './delete-account';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
let tenantId: string;

beforeEach(async () => {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  if (!tenant) throw new Error('failed to seed a tenant row');
  tenantId = tenant.id;
});

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.sessions);
  await db().delete(schema.accounts);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

async function seedUserWithRelatedRows(userId: string): Promise<void> {
  await db().insert(schema.users).values({ id: userId });
  await db()
    .insert(schema.accounts)
    .values({
      userId,
      type: 'oauth',
      provider: 'github',
      providerAccountId: `${userId}-github`,
    });
  await db()
    .insert(schema.sessions)
    .values({
      sessionToken: `${userId}-session`,
      userId,
      expires: new Date(2030, 0, 1),
    });
  await db()
    .insert(schema.bookmarks)
    .values({ tenantId, userId, postId: 'post-1' });
}

async function findUser(userId: string) {
  return db().select().from(schema.users).where(eq(schema.users.id, userId));
}

describe(deleteAccount, () => {
  beforeEach(async () => {
    await seedUserWithRelatedRows('user-1');
  });

  it('deletes the users row', async () => {
    await expect(deleteAccount('user-1')).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    const remainingUsers = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, 'user-1'));
    expect(remainingUsers).toEqual([]);
  });

  it('cascades to accounts, sessions, and bookmarks rows for that user', async () => {
    await deleteAccount('user-1');

    const remainingAccounts = await db()
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, 'user-1'));
    const remainingSessions = await db()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, 'user-1'));
    const remainingBookmarks = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, 'user-1'));

    expect(remainingAccounts).toEqual([]);
    expect(remainingSessions).toEqual([]);
    expect(remainingBookmarks).toEqual([]);
  });

  it("does not delete another user's rows", async () => {
    await seedUserWithRelatedRows('user-2');

    await deleteAccount('user-1');

    const remainingUsers = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, 'user-2'));
    const remainingBookmarks = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, 'user-2'));

    expect(remainingUsers).toHaveLength(1);
    expect(remainingBookmarks).toHaveLength(1);
  });

  it('is a no-op when the user does not exist', async () => {
    await expect(deleteAccount('missing-user')).resolves.toEqual({
      ok: true,
      data: undefined,
    });
  });

  it('deletes a user whose only memberships are below owner', async () => {
    await db()
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.EDITOR });

    await expect(deleteAccount('user-1')).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(await findUser('user-1')).toEqual([]);
  });

  it('refuses a tenant owner and keeps the account and its membership', async () => {
    await db()
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.OWNER });

    await expect(deleteAccount('user-1')).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE,
    });
    expect(await findUser('user-1')).toHaveLength(1);
    expect(
      await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, 'user-1')),
    ).toHaveLength(1);
  });

  it('refuses a platform admin and keeps the account and its admins row', async () => {
    await db().insert(schema.admins).values({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    await expect(deleteAccount('user-1')).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE,
    });
    expect(await findUser('user-1')).toHaveLength(1);
    expect(
      await db()
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.userId, 'user-1')),
    ).toHaveLength(1);
  });
});
