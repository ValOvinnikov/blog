import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addTenantDomain } from './add-tenant-domain';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(
  slug: string,
  primaryDomain: string,
): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain,
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
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
});

describe(addTenantDomain, () => {
  it('inserts a new domain row for the given tenant', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');

    const domain = await addTenantDomain(tenantId, 'acme.example.com');

    expect(domain).toMatchObject({ tenantId, domain: 'acme.example.com' });
  });

  it('is idempotent when the same (tenantId, domain) pair is added again', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');
    const first = await addTenantDomain(tenantId, 'acme.example.com');

    const second = await addTenantDomain(tenantId, 'acme.example.com');

    expect(second).toEqual(first);
    const rows = await db.select().from(schema.tenantDomains);
    expect(rows).toHaveLength(1);
  });

  it('rejects a domain already assigned to a different tenant', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');
    const otherTenantId = await insertTenant('other', 'other.example.com');
    await addTenantDomain(tenantId, 'shared.example.com');

    await expect(
      addTenantDomain(otherTenantId, 'shared.example.com'),
    ).rejects.toThrow();
  });
});

describe('foreign-key cascade', () => {
  it('removes a tenant_domains row when its owning tenant is deleted', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');
    await addTenantDomain(tenantId, 'acme.example.com');

    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db.select().from(schema.tenantDomains);
    expect(rows).toHaveLength(0);
  });
});
