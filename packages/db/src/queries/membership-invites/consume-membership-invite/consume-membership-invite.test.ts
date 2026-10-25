import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  insertTestUser,
  MOCK_INVITE_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { consumeMembershipInvite } from './consume-membership-invite';

vi.mock('@blog/db/client');

const MOCK_MISSING_USER_ID = 'missing-user';

const db = useQueryTestDb();

async function insertInvite(
  tenantId: string,
  email: string,
  role: (typeof MEMBERSHIP_ROLE)[keyof typeof MEMBERSHIP_ROLE] = MEMBERSHIP_ROLE.OWNER,
): Promise<string> {
  const [invite] = await db()
    .insert(schema.membershipInvites)
    .values({ tenantId, email, role })
    .returning();
  return invite!.id;
}

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(consumeMembershipInvite, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: 'user-1' });
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts the real membership row and stamps consumedAt', async () => {
    const inviteId = await insertInvite(
      tenantId,
      MOCK_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const membership = await consumeMembershipInvite(inviteId, 'user-1');

    expect(membership).toMatchObject({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const [invite] = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.id, inviteId));
    expect(invite!.consumedAt).not.toBeNull();
  });

  it('is idempotent for an already-consumed invite: no-op, returns undefined', async () => {
    const inviteId = await insertInvite(tenantId, MOCK_INVITE_EMAIL);
    await consumeMembershipInvite(inviteId, 'user-1');

    const second = await consumeMembershipInvite(inviteId, 'user-1');

    expect(second).toBeUndefined();
    const rows = await db().select().from(schema.memberships);
    expect(rows).toHaveLength(1);
  });

  it('returns undefined for an invite id that does not exist', async () => {
    const result = await consumeMembershipInvite(
      '00000000-0000-0000-0000-000000000000',
      'user-1',
    );

    expect(result).toBeUndefined();
  });

  it('rolls back the claim when the dependent membership insert fails, leaving the invite pending and retryable', async () => {
    const inviteId = await insertInvite(tenantId, MOCK_INVITE_EMAIL);

    await expect(
      consumeMembershipInvite(inviteId, MOCK_MISSING_USER_ID),
    ).rejects.toThrow();

    const [invite] = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.id, inviteId));
    expect(invite!.consumedAt).toBeNull();

    await insertTestUser(db(), { id: MOCK_MISSING_USER_ID });
    const membership = await consumeMembershipInvite(
      inviteId,
      MOCK_MISSING_USER_ID,
    );
    expect(membership).toMatchObject({
      userId: MOCK_MISSING_USER_ID,
      tenantId,
    });
  });

  it('returns the existing membership without erroring when one already exists for the (userId, tenantId) pair', async () => {
    const [existingMembership] = await db()
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.READER })
      .returning();
    const inviteId = await insertInvite(
      tenantId,
      MOCK_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const membership = await consumeMembershipInvite(inviteId, 'user-1');

    expect(membership).toEqual(existingMembership);
    const rows = await db().select().from(schema.memberships);
    expect(rows).toHaveLength(1);
  });
});
