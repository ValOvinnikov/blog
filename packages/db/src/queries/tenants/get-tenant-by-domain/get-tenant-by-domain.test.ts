import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantByDomain } from './get-tenant-by-domain';

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
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
});

describe(getTenantByDomain, () => {
  it('resolves the owning tenant via a tenant_domains row', async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'abc123',
        sanityDataset: 'production',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();
    await db
      .insert(schema.tenantDomains)
      .values({ tenantId: tenant!.id, domain: 'acme.example.com' });

    const result = await getTenantByDomain('acme.example.com');

    expect(result?.id).toBe(tenant!.id);
  });

  it('returns undefined for a domain with no row', async () => {
    const result = await getTenantByDomain('missing.example.com');

    expect(result).toBeUndefined();
  });
});
