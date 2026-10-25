import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantByDomain } from './get-tenant-by-domain';

vi.mock('@blog/db/client');

const MOCK_ACME_DOMAIN = 'acme.example.com';
const MOCK_OTHER_DOMAIN = 'other.example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(getTenantByDomain, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_ACME_DOMAIN,
    }));
  });

  it('resolves the owning tenant via a tenant_domains row', async () => {
    await db()
      .insert(schema.tenantDomains)
      .values({ tenantId, domain: MOCK_ACME_DOMAIN });

    const result = await getTenantByDomain(MOCK_ACME_DOMAIN);

    expect(result?.id).toBe(tenantId);
  });

  it('returns undefined for a domain with no row', async () => {
    const result = await getTenantByDomain('missing.example.com');

    expect(result).toBeUndefined();
  });

  it('does not cross-match a domain belonging to a different tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_DOMAIN,
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: MOCK_ACME_DOMAIN },
        { tenantId: otherTenantId, domain: MOCK_OTHER_DOMAIN },
      ]);

    const result = await getTenantByDomain(MOCK_OTHER_DOMAIN);

    expect(result?.id).toBe(otherTenantId);
    expect(result?.id).not.toBe(tenantId);
  });
});
