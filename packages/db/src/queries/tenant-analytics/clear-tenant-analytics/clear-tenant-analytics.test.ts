import { saveTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { tenantAnalytics } from '@shinefold/db/schema/tenant-analytics';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_GOOGLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { clearTenantAnalytics } from './clear-tenant-analytics';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

describe(clearTenantAnalytics, () => {
  it('removes the tenant’s analytics and leaves another tenant’s', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);
    await saveTenantAnalytics(otherTenantId, MOCK_GOOGLE_ANALYTICS);

    expect(await clearTenantAnalytics(tenant().id)).toBe(true);
    expect(await db().select().from(tenantAnalytics)).toEqual([
      expect.objectContaining({ tenantId: otherTenantId }),
    ]);
  });

  it('resolves false when the tenant saved no analytics', async () => {
    expect(await clearTenantAnalytics(tenant().id)).toBe(false);
  });
});
