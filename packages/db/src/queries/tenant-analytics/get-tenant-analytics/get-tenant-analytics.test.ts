import { TENANT_PLAN } from '@shinefold/config/constants';
import { saveTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { tenantAnalytics } from '@shinefold/db/schema/tenant-analytics';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_GOOGLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { getTenantAnalytics } from './get-tenant-analytics';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.STARTER });

describe(getTenantAnalytics, () => {
  it('returns nothing for a tenant that saved no analytics', async () => {
    expect(await getTenantAnalytics(tenant().id)).toBeUndefined();
  });

  it.each([TENANT_PLAN.STARTER, TENANT_PLAN.GROWTH])(
    'returns the saved provider and id on %s',
    async (plan) => {
      await patchTestTenant(db(), tenant().id, { plan });
      await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);

      expect(await getTenantAnalytics(tenant().id)).toEqual(
        MOCK_GOOGLE_ANALYTICS,
      );
    },
  );

  it('returns nothing on Free and keeps the stored value', async () => {
    await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);
    await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.FREE });

    expect(await getTenantAnalytics(tenant().id)).toBeUndefined();
    expect(await db().select().from(tenantAnalytics)).toEqual([
      expect.objectContaining(MOCK_GOOGLE_ANALYTICS),
    ]);
  });
});
