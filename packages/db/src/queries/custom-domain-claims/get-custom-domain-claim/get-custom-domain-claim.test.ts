import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_SHARED_TENANT_DOMAIN } from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { getCustomDomainClaim } from './get-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenants);
});

describe(getCustomDomainClaim, () => {
  it("returns the site's claim", async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    });
    const [claim] = await db()
      .insert(schema.customDomainClaims)
      .values({ tenantId, domain: MOCK_SHARED_TENANT_DOMAIN, token: 'token' })
      .returning();

    const result = await getCustomDomainClaim(tenantId);

    expect(result).toEqual(claim);
  });

  it('returns undefined when the site has no claim', async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    });

    const result = await getCustomDomainClaim(tenantId);

    expect(result).toBeUndefined();
  });
});
