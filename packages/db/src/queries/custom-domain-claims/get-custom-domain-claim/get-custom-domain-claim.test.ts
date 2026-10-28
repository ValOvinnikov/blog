import * as schema from '@blog/db/schema';
import { insertTestCustomDomainClaim } from '@blog/db/testing/custom-domain-claims/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { getCustomDomainClaim } from './get-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenants);
});

describe(getCustomDomainClaim, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it("returns the site's claim", async () => {
    const claim = await insertTestCustomDomainClaim(db(), { tenantId });

    const result = await getCustomDomainClaim(tenantId);

    expect(result).toEqual(claim);
  });

  it('returns undefined when the site has no claim', async () => {
    const result = await getCustomDomainClaim(tenantId);

    expect(result).toBeUndefined();
  });
});
