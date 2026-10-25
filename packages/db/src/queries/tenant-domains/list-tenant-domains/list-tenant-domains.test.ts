import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listTenantDomains } from './list-tenant-domains';

vi.mock('@blog/db/client');

const MOCK_ACME_DOMAIN = 'acme.example.com';
const MOCK_OTHER_DOMAIN = 'other.example.com';
const MOCK_WWW_ACME_DOMAIN = 'www.acme.example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(listTenantDomains, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_ACME_DOMAIN,
    }));
  });

  it('returns every domain for the given tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_DOMAIN,
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: MOCK_ACME_DOMAIN },
        { tenantId, domain: MOCK_WWW_ACME_DOMAIN },
        { tenantId: otherTenantId, domain: MOCK_OTHER_DOMAIN },
      ]);

    const result = await listTenantDomains(tenantId);

    expect(result.map((row) => row.domain).sort()).toEqual([
      MOCK_ACME_DOMAIN,
      MOCK_WWW_ACME_DOMAIN,
    ]);
  });

  it('returns an empty array for a tenant with no domains', async () => {
    const result = await listTenantDomains(tenantId);

    expect(result).toEqual([]);
  });
});
