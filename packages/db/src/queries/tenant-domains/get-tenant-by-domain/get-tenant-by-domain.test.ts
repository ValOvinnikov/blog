import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { getTenantByDomain } from './get-tenant-by-domain';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(getTenantByDomain, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it('resolves the owning tenant of a registered domain', async () => {
    await db()
      .insert(schema.tenantDomains)
      .values({ tenantId, domain: MOCK_TENANT_DOMAIN });

    const result = await getTenantByDomain(MOCK_TENANT_DOMAIN);

    expect(result?.id).toBe(tenantId);
  });

  it('returns undefined for an unregistered domain', async () => {
    const result = await getTenantByDomain(MOCK_MISSING_TENANT_DOMAIN);

    expect(result).toBeUndefined();
  });

  it('resolves a domain to its own tenant, not a neighbour', async () => {
    const { id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    });
    await db()
      .insert(schema.tenantDomains)
      .values([
        { tenantId, domain: MOCK_TENANT_DOMAIN },
        { tenantId: otherTenantId, domain: MOCK_OTHER_TENANT_DOMAIN },
      ]);

    const result = await getTenantByDomain(MOCK_OTHER_TENANT_DOMAIN);

    expect(result?.id).toBe(otherTenantId);
  });
});
