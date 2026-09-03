import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantDomains } from './list-tenant-domains';

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

describe(listTenantDomains, () => {
  it('returns every domain for the given tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      primaryDomain: 'acme.example.com',
    });
    const { id: otherTenantId } = await insertTestTenant(db, {
      primaryDomain: 'other.example.com',
    });
    await db.insert(schema.tenantDomains).values([
      { tenantId, domain: 'acme.example.com' },
      { tenantId, domain: 'www.acme.example.com' },
      { tenantId: otherTenantId, domain: 'other.example.com' },
    ]);

    const result = await listTenantDomains(tenantId);

    expect(result.map((row) => row.domain).sort()).toEqual([
      'acme.example.com',
      'www.acme.example.com',
    ]);
  });

  it('returns an empty array for a tenant with no domains', async () => {
    const { id: tenantId } = await insertTestTenant(db, {
      primaryDomain: 'acme.example.com',
    });

    const result = await listTenantDomains(tenantId);

    expect(result).toEqual([]);
  });
});
