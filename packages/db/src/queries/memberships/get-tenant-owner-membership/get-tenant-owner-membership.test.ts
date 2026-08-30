import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

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
  await db.delete(schema.membershipInvites);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(getTenantOwnerMembership, () => {
  it('returns the OWNER membership email and joinedAt for the tenant', async () => {
    await insertTestUser(db, { id: 'user-1', email: 'owner@example.com' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const [membership] = await db
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
    await insertTestUser(db, { id: 'user-1', email: 'editor@example.com' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when only a pending OWNER invite exists (no real membership row)', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db.insert(schema.membershipInvites).values({
      tenantId,
      email: 'owner@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the owner user has no email on file', async () => {
    await insertTestUser(db, { id: 'user-1', email: null });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });
});
