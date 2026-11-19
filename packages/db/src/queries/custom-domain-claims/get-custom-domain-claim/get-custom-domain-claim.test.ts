import * as schema from '@shinefold/db/schema';
import { insertTestCustomDomainClaim } from '@shinefold/db/testing/custom-domain-claims/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getCustomDomainClaim } from './get-custom-domain-claim';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { primaryDomain: MOCK_TENANT_DOMAIN });

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
});

describe(getCustomDomainClaim, () => {
  it("returns the site's claim", async () => {
    const claim = await insertTestCustomDomainClaim(db(), {
      tenantId: tenant().id,
    });

    const result = await getCustomDomainClaim(tenant().id);

    expect(result).toEqual(claim);
  });

  it('returns undefined when the site has no claim', async () => {
    const result = await getCustomDomainClaim(tenant().id);

    expect(result).toBeUndefined();
  });
});
