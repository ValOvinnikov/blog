import { TENANT_PLAN } from '@shinefold/config/constants';
import { saveTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_PLAUSIBLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { getStoredTenantAnalytics } from './get-stored-tenant-analytics';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.STARTER });

describe(getStoredTenantAnalytics, () => {
  it('returns nothing for a tenant that saved no analytics', async () => {
    expect(await getStoredTenantAnalytics(tenant().id)).toBeUndefined();
  });

  it.each(Object.values(TENANT_PLAN))(
    'returns the saved provider and id on %s',
    async (plan) => {
      await saveTenantAnalytics(tenant().id, MOCK_PLAUSIBLE_ANALYTICS);
      await patchTestTenant(db(), tenant().id, { plan });

      expect(await getStoredTenantAnalytics(tenant().id)).toEqual(
        MOCK_PLAUSIBLE_ANALYTICS,
      );
    },
  );
});
