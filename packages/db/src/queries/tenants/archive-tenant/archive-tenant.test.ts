import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { archiveTenant } from './archive-tenant';

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
      status: TENANT_STATUS.ACTIVE,
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
  await db.delete(schema.tenants);
});

describe(archiveTenant, () => {
  it('stamps deprovisionedAt and returns the updated row', async () => {
    const tenantId = await insertTenant();

    const result = await archiveTenant(tenantId);

    expect(result.deprovisionedAt).toBeInstanceOf(Date);

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.deprovisionedAt).toBeInstanceOf(Date);
  });

  it('leaves the slug intact so it stays reserved', async () => {
    const tenantId = await insertTenant();

    const result = await archiveTenant(tenantId);

    expect(result.slug).toBe('acme');
  });

  it('throws for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(archiveTenant(missingId)).rejects.toThrow(
      `archiveTenant: update for tenant "${missingId}" returned no row.`,
    );
  });
});
