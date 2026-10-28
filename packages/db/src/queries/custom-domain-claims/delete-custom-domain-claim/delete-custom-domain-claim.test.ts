import * as schema from '@blog/db/schema';
import { insertTestCustomDomainClaim } from '@blog/db/testing/custom-domain-claims/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { deleteCustomDomainClaim } from './delete-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenants);
});

describe(deleteCustomDomainClaim, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it('deletes the claim and returns true', async () => {
    await insertTestCustomDomainClaim(db(), { tenantId });

    const result = await deleteCustomDomainClaim(tenantId);

    const rows = await db().select().from(schema.customDomainClaims);
    expect(result).toBe(true);
    expect(rows).toEqual([]);
  });

  it('returns false when the site has no claim', async () => {
    const result = await deleteCustomDomainClaim(tenantId);

    expect(result).toBe(false);
  });
});
