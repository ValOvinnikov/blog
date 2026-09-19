import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantByDomain } from './get-tenant-by-domain';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(getTenantByDomain, () => {
  it('resolves the owning tenant via a tenant_domains row', async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: 'acme.example.com',
    });
    await db()
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
    const { id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: 'acme.example.com',
    });
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: 'other.example.com',
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: 'acme.example.com' },
        { tenantId: otherTenantId, domain: 'other.example.com' },
      ]);

    const result = await getTenantByDomain('other.example.com');

    expect(result?.id).toBe(otherTenantId);
    expect(result?.id).not.toBe(tenantId);
  });
});
