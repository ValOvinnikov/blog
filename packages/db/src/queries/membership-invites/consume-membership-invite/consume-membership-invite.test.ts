import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { consumeMembershipInvite } from './consume-membership-invite';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertInvite(
  tenantId: string,
  email: string,
  role: (typeof MEMBERSHIP_ROLE)[keyof typeof MEMBERSHIP_ROLE] = MEMBERSHIP_ROLE.OWNER,
): Promise<string> {
  const [invite] = await db
    .insert(schema.membershipInvites)
    .values({ tenantId, email, role })
    .returning();
  return invite!.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.membershipInvites);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(consumeMembershipInvite, () => {
  it('inserts the real membership row and stamps consumedAt', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const inviteId = await insertInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    const membership = await consumeMembershipInvite(inviteId, 'user-1');

    expect(membership).toMatchObject({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const [invite] = await db
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.id, inviteId));
    expect(invite!.consumedAt).not.toBeNull();
  });

  it('is idempotent for an already-consumed invite: no-op, returns undefined', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const inviteId = await insertInvite(tenantId, 'owner@example.com');
    await consumeMembershipInvite(inviteId, 'user-1');

    const second = await consumeMembershipInvite(inviteId, 'user-1');

    expect(second).toBeUndefined();
    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(1);
  });

  it('returns undefined for an invite id that does not exist', async () => {
    await insertTestUser(db, { id: 'user-1' });

    const result = await consumeMembershipInvite(
      '00000000-0000-0000-0000-000000000000',
      'user-1',
    );

    expect(result).toBeUndefined();
  });

  it('rolls back the claim when the dependent membership insert fails, leaving the invite pending and retryable', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const inviteId = await insertInvite(tenantId, 'owner@example.com');

    await expect(
      consumeMembershipInvite(inviteId, 'missing-user'),
    ).rejects.toThrow();

    const [invite] = await db
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.id, inviteId));
    expect(invite!.consumedAt).toBeNull();

    // Retryable once a real user exists for that id.
    await insertTestUser(db, { id: 'missing-user' });
    const membership = await consumeMembershipInvite(inviteId, 'missing-user');
    expect(membership).toMatchObject({ userId: 'missing-user', tenantId });
  });

  it('returns the existing membership without erroring when one already exists for the (userId, tenantId) pair', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const [existingMembership] = await db
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.READER })
      .returning();
    const inviteId = await insertInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    const membership = await consumeMembershipInvite(inviteId, 'user-1');

    // The pre-existing membership's role is untouched — this function only
    // creates a membership, it never mutates an existing one.
    expect(membership).toEqual(existingMembership);
    const rows = await db.select().from(schema.memberships);
    expect(rows).toHaveLength(1);
  });
});
