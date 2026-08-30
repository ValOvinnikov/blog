import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
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
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
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
    const { id: tenantId } = await insertTestTenant(db, {
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });
    const { id: otherTenantId } = await insertTestTenant(db, {
      slug: 'other',
      primaryDomain: 'other.example.com',
    });
    await db.insert(schema.tenantDomains).values([
      { tenantId, domain: 'acme.example.com' },
      { tenantId: otherTenantId, domain: 'other.example.com' },
    ]);

    const result = await getTenantByDomain('other.example.com');

    expect(result?.id).toBe(otherTenantId);
    expect(result?.id).not.toBe(tenantId);
  });
});
