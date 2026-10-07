import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getTenantOwnerMembership, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the OWNER membership email and joinedAt for the tenant', async () => {
    await insertTestUser(db(), { id: 'user-1', email: 'owner@example.com' });
    const [membership] = await db()
      .insert(schema.memberships)
      .values({
        userId: 'user-1',
        tenantId,
        role: MEMBERSHIP_ROLE.OWNER,
      })
      .returning();

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: 'owner@example.com',
      joinedAt: membership!.createdAt,
    });
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertTestUser(db(), { id: 'user-1', email: 'editor@example.com' });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when only a pending OWNER invite exists (no real membership row)', async () => {
    await db().insert(schema.membershipInvites).values({
      tenantId,
      email: 'owner@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the owner user has no email on file', async () => {
    await insertTestUser(db(), { id: 'user-1', email: null });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });
});
