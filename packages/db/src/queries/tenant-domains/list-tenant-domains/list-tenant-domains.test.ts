import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
  insertTestTenantDomain,
} from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

import { listTenantDomains } from './list-tenant-domains';

vi.mock('@shinefold/db/client');

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
    await insertTestTenantDomain(db(), tenantId, MOCK_TENANT_DOMAIN);
    await insertTestTenantDomain(db(), tenantId, MOCK_WWW_TENANT_DOMAIN);
    await insertTestTenantDomain(db(), otherTenantId, MOCK_OTHER_TENANT_DOMAIN);

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
