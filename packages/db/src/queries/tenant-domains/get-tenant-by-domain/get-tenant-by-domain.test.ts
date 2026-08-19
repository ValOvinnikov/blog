import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantByDomain } from './get-tenant-by-domain';

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

describe(getTenantByDomain, () => {
  it('resolves the owning tenant via a tenant_domains row', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');
    await db
      .insert(schema.tenantDomains)
      .values({ tenantId, domain: 'acme.example.com' });

    const result = await getTenantByDomain('acme.example.com');

    expect(result?.id).toBe(tenantId);
  });

  it('returns undefined for a domain with no row', async () => {
    const result = await getTenantByDomain('missing.example.com');

    expect(result).toBeUndefined();
  });

  it('does not cross-match a domain belonging to a different tenant', async () => {
    const tenantId = await insertTenant('acme', 'acme.example.com');
    const otherTenantId = await insertTenant('other', 'other.example.com');
    await db.insert(schema.tenantDomains).values([
      { tenantId, domain: 'acme.example.com' },
      { tenantId: otherTenantId, domain: 'other.example.com' },
    ]);

    const result = await getTenantByDomain('other.example.com');

    expect(result?.id).toBe(otherTenantId);
    expect(result?.id).not.toBe(tenantId);
  });
});
