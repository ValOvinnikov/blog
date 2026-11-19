import { TENANT_PLAN } from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestCustomDomainClaim } from '@shinefold/db/testing/custom-domain-claims/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { deleteCustomDomainClaim } from './delete-custom-domain-claim';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { primaryDomain: MOCK_TENANT_DOMAIN });

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
});

describe(deleteCustomDomainClaim, () => {
  it('returns false when the site has no claim', async () => {
    const result = await deleteCustomDomainClaim(tenant().id);

    expect(result).toBe(false);
  });

  describe('with a pending claim', () => {
    beforeEach(async () => {
      await insertTestCustomDomainClaim(db(), { tenantId: tenant().id });
    });

    it('deletes the claim and returns true', async () => {
      const result = await deleteCustomDomainClaim(tenant().id);

      const rows = await db().select().from(schema.customDomainClaims);
      expect(result).toBe(true);
      expect(rows).toEqual([]);
    });

    it('keeps the claim once the site has left the given plan', async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.GROWTH });

      await expect(
        deleteCustomDomainClaim(tenant().id, TENANT_PLAN.FREE),
      ).resolves.toBe(false);
    });
  });
});
