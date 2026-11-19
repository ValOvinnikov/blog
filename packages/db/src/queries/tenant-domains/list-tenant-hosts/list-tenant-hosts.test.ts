import * as schema from '@shinefold/db/schema';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_WWW_TENANT_DOMAIN,
  insertTestTenantDomain,
} from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listTenantHosts } from './list-tenant-hosts';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { primaryDomain: MOCK_TENANT_DOMAIN });

afterEach(async () => {
  await db().delete(schema.tenantDomains);
});

describe(listTenantHosts, () => {
  it('returns the primary domain once beside every other domain row', async () => {
    await insertTestTenantDomain(db(), tenant().id, MOCK_TENANT_DOMAIN);
    await insertTestTenantDomain(db(), tenant().id, MOCK_WWW_TENANT_DOMAIN);

    const result = await listTenantHosts(tenant());

    expect(result.sort()).toEqual(
      [MOCK_TENANT_DOMAIN, MOCK_WWW_TENANT_DOMAIN].sort(),
    );
  });

  it('returns the primary domain for a tenant with no domain rows', async () => {
    const result = await listTenantHosts(tenant());

    expect(result).toEqual([MOCK_TENANT_DOMAIN]);
  });
});
