import * as schema from '@shinefold/db/schema';
import { insertTestCustomDomainClaim } from '@shinefold/db/testing/custom-domain-claims/fixtures';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

import { getCustomDomainClaim } from './get-custom-domain-claim';

vi.mock('@shinefold/db/client');

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
