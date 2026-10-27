import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { listTenantDomains } from './list-tenant-domains';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(listTenantDomains, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it('returns every domain for the given tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: MOCK_TENANT_DOMAIN },
        { tenantId, domain: MOCK_WWW_TENANT_DOMAIN },
        { tenantId: otherTenantId, domain: MOCK_OTHER_TENANT_DOMAIN },
      ]);

    const result = await listTenantDomains(tenantId);

    const domains = result.map(({ domain }) => domain).sort();
    expect(domains).toEqual(
      [MOCK_TENANT_DOMAIN, MOCK_WWW_TENANT_DOMAIN].sort(),
    );
  });

  it('returns an empty array for a tenant with no domains', async () => {
    const result = await listTenantDomains(tenantId);

    expect(result).toEqual([]);
  });
});
