import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { deleteTenant } from './delete-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date(),
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
});

describe(deleteTenant, () => {
  it('deletes the tenant row', async () => {
    const tenantId = await insertTenant();

    await deleteTenant(tenantId);

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toEqual([]);
  });

  it('cascades to dependent membership rows for that tenant', async () => {
    const tenantId = await insertTenant();
    await db.insert(schema.users).values({ id: 'user-1' });
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    await deleteTenant(tenantId);

    const remainingMemberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenantId));
    expect(remainingMemberships).toEqual([]);
  });

  it('is a no-op when the tenant does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(deleteTenant(missingId)).resolves.toBeUndefined();
  });
});
