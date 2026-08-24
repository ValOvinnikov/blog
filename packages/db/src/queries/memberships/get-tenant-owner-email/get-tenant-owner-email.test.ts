import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantOwnerEmail } from './get-tenant-owner-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string, email: string | null): Promise<void> {
  await db.insert(schema.users).values({ id, email });
}

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
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

describe(getTenantOwnerEmail, () => {
  it('returns the OWNER membership user email for the tenant', async () => {
    await insertUser('user-1', 'owner@example.com');
    const tenantId = await insertTenant('acme');
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe('owner@example.com');
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertUser('user-1', 'editor@example.com');
    const tenantId = await insertTenant('acme');
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const tenantId = await insertTenant('acme');

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });

  it('falls back to a still-pending OWNER membershipInvite when no memberships row exists yet', async () => {
    const tenantId = await insertTenant('acme');
    await db.insert(schema.membershipInvites).values({
      tenantId,
      email: 'owner@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe('owner@example.com');
  });

  it('prefers a real OWNER membership over a still-pending invite for the same tenant', async () => {
    await insertUser('user-1', 'signed-in-owner@example.com');
    const tenantId = await insertTenant('acme');
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
    await db.insert(schema.membershipInvites).values({
      tenantId,
      email: 'stale-invite@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe('signed-in-owner@example.com');
  });

  it('ignores an already-consumed OWNER invite', async () => {
    const tenantId = await insertTenant('acme');
    await db.insert(schema.membershipInvites).values({
      tenantId,
      email: 'owner@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: new Date(),
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });

  it('ignores a non-OWNER invite on the same tenant', async () => {
    const tenantId = await insertTenant('acme');
    await db.insert(schema.membershipInvites).values({
      tenantId,
      email: 'editor@example.com',
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the owner user has no email on file', async () => {
    await insertUser('user-1', null);
    const tenantId = await insertTenant('acme');
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });
});
