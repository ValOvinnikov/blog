import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_WWW_TENANT_DOMAIN } from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

import { listTenantHosts } from './list-tenant-hosts';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(listTenantHosts, () => {
  it('returns the primary domain once beside every other domain row', async () => {
    const tenant = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId: tenant.id, domain: MOCK_TENANT_DOMAIN },
        { tenantId: tenant.id, domain: MOCK_WWW_TENANT_DOMAIN },
      ]);

    const result = await listTenantHosts(tenant);

    expect(result.sort()).toEqual(
      [MOCK_TENANT_DOMAIN, MOCK_WWW_TENANT_DOMAIN].sort(),
    );
  });

  it('returns the primary domain for a tenant with no domain rows', async () => {
    const tenant = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    });

    const result = await listTenantHosts(tenant);

    expect(result).toEqual([MOCK_TENANT_DOMAIN]);
  });
});
