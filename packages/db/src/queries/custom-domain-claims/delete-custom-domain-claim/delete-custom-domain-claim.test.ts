import { TENANT_PLAN } from '@blog/db/constants';
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

  it('returns false when the site has no claim', async () => {
    const result = await deleteCustomDomainClaim(tenantId);

    expect(result).toBe(false);
  });

  describe('with a pending claim', () => {
    beforeEach(async () => {
      await insertTestCustomDomainClaim(db(), { tenantId });
    });

    it('deletes the claim and returns true', async () => {
      const result = await deleteCustomDomainClaim(tenantId);

      const rows = await db().select().from(schema.customDomainClaims);
      expect(result).toBe(true);
      expect(rows).toEqual([]);
    });

    it('keeps the claim once the site has left the given plan', async () => {
      await db().update(schema.tenants).set({ plan: TENANT_PLAN.GROWTH });

      await expect(
        deleteCustomDomainClaim(tenantId, TENANT_PLAN.FREE),
      ).resolves.toBe(false);
    });
  });
});
