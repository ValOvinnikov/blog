import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
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

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const DELETE_FAILURE = 'connection lost';
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
  await db().delete(schema.auditEvents);
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

async function seedAuditEvent(actorId: string): Promise<void> {
  await db()
    .insert(schema.auditEvents)
    .values({
      actorId,
      actorEmail: `${actorId}@example.com`,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
    });
}

async function findAuditEvents(actorId: string) {
  return db()
    .select({
      actorId: schema.auditEvents.actorId,
      actorEmail: schema.auditEvents.actorEmail,
    })
    .from(schema.auditEvents)
    .where(eq(schema.auditEvents.actorId, actorId));
}

async function findUser(userId: string) {
  return db().select().from(schema.users).where(eq(schema.users.id, userId));
}

describe(deleteAccount, () => {
  beforeEach(async () => {
    await seedUserWithRelatedRows(USER_ID);
  });

  it('deletes the users row', async () => {
    await expect(deleteAccount(USER_ID)).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    const remainingUsers = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, USER_ID));
    expect(remainingUsers).toEqual([]);
  });

  it('cascades to accounts, sessions, and bookmarks rows for that user', async () => {
    await deleteAccount(USER_ID);

    const remainingAccounts = await db()
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, USER_ID));
    const remainingSessions = await db()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, USER_ID));
    const remainingBookmarks = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, USER_ID));

    expect(remainingAccounts).toEqual([]);
    expect(remainingSessions).toEqual([]);
    expect(remainingBookmarks).toEqual([]);
  });

  it("does not delete another user's rows", async () => {
    await seedUserWithRelatedRows(OTHER_USER_ID);

    await deleteAccount(USER_ID);

    const remainingUsers = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, OTHER_USER_ID));
    const remainingBookmarks = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, OTHER_USER_ID));

    expect(remainingUsers).toHaveLength(1);
    expect(remainingBookmarks).toHaveLength(1);
  });

  it("keeps the user's audit events but clears their email", async () => {
    await seedAuditEvent(USER_ID);

    await deleteAccount(USER_ID);

    expect(await findAuditEvents(USER_ID)).toEqual([
      { actorId: USER_ID, actorEmail: null },
    ]);
  });

  it('removes the user and their audit email on a retry after the user delete fails', async () => {
    await seedAuditEvent(USER_ID);
    const testDb = db();
    const deleteFrom = testDb.delete.bind(testDb);
    let shouldFail = true;
    testDb.delete = (table) => {
      if (!shouldFail) return deleteFrom(table);
      shouldFail = false;
      throw new Error(DELETE_FAILURE);
    };

    await expect(deleteAccount(USER_ID)).rejects.toThrow(DELETE_FAILURE);
    expect(await findUser(USER_ID)).toHaveLength(1);
    expect(await findAuditEvents(USER_ID)).toEqual([
      { actorId: USER_ID, actorEmail: null },
    ]);

    await expect(deleteAccount(USER_ID)).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    expect(await findUser(USER_ID)).toEqual([]);
    expect(await findAuditEvents(USER_ID)).toEqual([
      { actorId: USER_ID, actorEmail: null },
    ]);
  });

  it("leaves another actor's audit email in place", async () => {
    await seedAuditEvent(OTHER_USER_ID);

    await deleteAccount(USER_ID);

    expect(await findAuditEvents(OTHER_USER_ID)).toEqual([
      { actorId: OTHER_USER_ID, actorEmail: `${OTHER_USER_ID}@example.com` },
    ]);
  });

  it('keeps the audit email of a refused owner', async () => {
    await seedAuditEvent(USER_ID);
    await db()
      .insert(schema.memberships)
      .values({ userId: USER_ID, tenantId, role: MEMBERSHIP_ROLE.OWNER });

    await deleteAccount(USER_ID);

    expect(await findAuditEvents(USER_ID)).toEqual([
      { actorId: USER_ID, actorEmail: `${USER_ID}@example.com` },
    ]);
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
      .values({ userId: USER_ID, tenantId, role: MEMBERSHIP_ROLE.EDITOR });

    await expect(deleteAccount(USER_ID)).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(await findUser(USER_ID)).toEqual([]);
  });

  it('refuses a tenant owner and keeps the account and its membership', async () => {
    await db()
      .insert(schema.memberships)
      .values({ userId: USER_ID, tenantId, role: MEMBERSHIP_ROLE.OWNER });

    await expect(deleteAccount(USER_ID)).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE,
    });
    expect(await findUser(USER_ID)).toHaveLength(1);
    expect(
      await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, USER_ID)),
    ).toHaveLength(1);
  });

  it('refuses a platform admin and keeps the account and its admins row', async () => {
    await db().insert(schema.admins).values({
      userId: USER_ID,
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    await expect(deleteAccount(USER_ID)).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE,
    });
    expect(await findUser(USER_ID)).toHaveLength(1);
    expect(
      await db()
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.userId, USER_ID)),
    ).toHaveLength(1);
  });
});
