import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { saveTenantAnalytics } from '@blog/db/queries/tenant-analytics/save-tenant-analytics';
import * as schema from '@blog/db/schema';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_GOOGLE_ANALYTICS } from '@blog/db/testing/tenant-analytics/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import { getTenantAnalytics } from './get-tenant-analytics';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.STARTER });

async function setPlan(plan: TTenantPlan) {
  await db()
    .update(schema.tenants)
    .set({ plan })
    .where(eq(schema.tenants.id, tenant().id));
}

describe(getTenantAnalytics, () => {
  it('returns nothing for a tenant that saved no analytics', async () => {
    expect(await getTenantAnalytics(tenant().id)).toBeUndefined();
  });

  it.each([TENANT_PLAN.STARTER, TENANT_PLAN.GROWTH])(
    'returns the saved provider and id on %s',
    async (plan) => {
      await setPlan(plan);
      await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);

      expect(await getTenantAnalytics(tenant().id)).toEqual(
        MOCK_GOOGLE_ANALYTICS,
      );
    },
  );

  it('returns nothing on Free and keeps the stored value', async () => {
    await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);
    await setPlan(TENANT_PLAN.FREE);

    expect(await getTenantAnalytics(tenant().id)).toBeUndefined();
    expect(await db().select().from(tenantAnalytics)).toEqual([
      expect.objectContaining(MOCK_GOOGLE_ANALYTICS),
    ]);
  });
});
