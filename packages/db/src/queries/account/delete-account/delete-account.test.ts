import { AUDIT_ACTION, ERROR_CODE } from '@blog/config/constants';
import { ADMIN_ROLE, GRANTED_VIA, MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { GITHUB_PROVIDER } from '@blog/db/testing/account/fixtures';
import {
  insertTestAccount,
  insertTestAuditEvent,
  insertTestTenant,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { deleteAccount } from './delete-account';

vi.mock('@blog/db/client');

faker.seed(602201);

const MOCK_REF_DATE = new Date(Date.UTC(2026, 0, 1));

const MOCK_MISSING_USER_ID = faker.string.uuid();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_SESSION_EXPIRES = faker.date.future({ refDate: MOCK_REF_DATE });

const db = useQueryTestDb();
let tenantId: string;
let userId: string;

beforeEach(async () => {
  ({ id: tenantId } = await insertTestTenant(db()));
});

afterEach(async () => {
  await db().delete(schema.auditEvents);
  await db().delete(schema.bookmarks);
  await db().delete(schema.sessions);
  await db().delete(schema.accounts);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

async function seedUserWithRelatedRows(): Promise<string> {
  const { id } = await insertTestUser(db());
  await insertTestAccount(db(), id, GITHUB_PROVIDER);
  await db().insert(schema.sessions).values({
    sessionToken: faker.string.uuid(),
    userId: id,
    expires: MOCK_SESSION_EXPIRES,
  });
  await db()
    .insert(schema.bookmarks)
    .values({ tenantId, userId: id, postId: MOCK_POST_ID });

  return id;
}

async function findUser(id: string) {
  return db().select().from(schema.users).where(eq(schema.users.id, id));
}

async function findBookmarks(id: string) {
  return db()
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, id));
}

describe(deleteAccount, () => {
  beforeEach(async () => {
    userId = await seedUserWithRelatedRows();
  });

  it('deletes the users row', async () => {
    const result = await deleteAccount(userId);

    expect(result).toEqual(okResult());
    expect(await findUser(userId)).toEqual([]);
  });

  it('cascades to accounts, sessions, and bookmarks rows for that user', async () => {
    await deleteAccount(userId);

    const remainingAccounts = await db()
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, userId));
    const remainingSessions = await db()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId));

    expect(remainingAccounts).toEqual([]);
    expect(remainingSessions).toEqual([]);
    expect(await findBookmarks(userId)).toEqual([]);
  });

  it("does not delete another user's rows", async () => {
    const otherUserId = await seedUserWithRelatedRows();

    await deleteAccount(userId);

    expect(await findUser(otherUserId)).toHaveLength(1);
    expect(await findBookmarks(otherUserId)).toHaveLength(1);
  });

  it("keeps the user's audit events", async () => {
    await insertTestAuditEvent(db(), {
      actorId: userId,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
    });

    await deleteAccount(userId);

    const events = await db()
      .select({ actorId: schema.auditEvents.actorId })
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.actorId, userId));
    expect(events).toEqual([{ actorId: userId }]);
  });

  it('is a no-op when the user does not exist', async () => {
    const result = await deleteAccount(MOCK_MISSING_USER_ID);

    expect(result).toEqual(okResult());
  });

  it('deletes a user whose only memberships are below owner', async () => {
    await db()
      .insert(schema.memberships)
      .values({ userId, tenantId, role: MEMBERSHIP_ROLE.EDITOR });

    const result = await deleteAccount(userId);

    expect(result).toEqual(okResult());
    expect(await findUser(userId)).toEqual([]);
  });

  it('refuses a tenant owner and keeps the account and its membership', async () => {
    await db()
      .insert(schema.memberships)
      .values({ userId, tenantId, role: MEMBERSHIP_ROLE.OWNER });

    const result = await deleteAccount(userId);

    const remainingMemberships = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, userId));
    expect(result).toEqual(errorResult(ERROR_CODE.DB_HOLDS_PLATFORM_ROLE));
    expect(await findUser(userId)).toHaveLength(1);
    expect(remainingMemberships).toHaveLength(1);
  });

  it('refuses a platform admin and keeps the account and its admins row', async () => {
    await db().insert(schema.admins).values({
      userId,
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    const result = await deleteAccount(userId);

    const remainingAdmins = await db()
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.userId, userId));
    expect(result).toEqual(errorResult(ERROR_CODE.DB_HOLDS_PLATFORM_ROLE));
    expect(await findUser(userId)).toHaveLength(1);
    expect(remainingAdmins).toHaveLength(1);
  });
});
