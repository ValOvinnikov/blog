import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createMembership } from './create-membership';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so the (userId, tenantId) unique
// constraint and both foreign keys under test are the real Postgres
// constraints, not mocked stand-ins.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(createMembership, () => {
  it('inserts a new membership row', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db);

    const membership = await createMembership(
      'user-1',
      tenantId,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(membership).toMatchObject({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('is idempotent when the (userId, tenantId) pair already has a membership', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db);
    const first = await createMembership(
      'user-1',
      tenantId,
      MEMBERSHIP_ROLE.OWNER,
    );

    const second = await createMembership(
      'user-1',
      tenantId,
      MEMBERSHIP_ROLE.EDITOR,
    );

    // Not updated to EDITOR — a no-op insert leaves the existing row as-is.
    expect(second).toEqual(first);
    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(1);
  });

  it('allows the same user to hold memberships on different tenants', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantOneId } = await insertTestTenant(db);
    const { id: tenantTwoId } = await insertTestTenant(db);

    await createMembership('user-1', tenantOneId, MEMBERSHIP_ROLE.OWNER);
    await createMembership('user-1', tenantTwoId, MEMBERSHIP_ROLE.READER);

    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(2);
  });

  it('rejects a membership for a user that does not exist', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await expect(
      createMembership('missing-user', tenantId, MEMBERSHIP_ROLE.OWNER),
    ).rejects.toThrow();
  });
});

describe('foreign-key cascade', () => {
  it('removes a membership when its owning user is deleted', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db);
    await createMembership('user-1', tenantId, MEMBERSHIP_ROLE.OWNER);

    await db.delete(schema.users).where(eq(schema.users.id, 'user-1'));

    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(0);
  });

  it('removes a membership when its owning tenant is deleted', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db);
    await createMembership('user-1', tenantId, MEMBERSHIP_ROLE.OWNER);

    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(0);
  });
});
