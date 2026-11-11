import { TENANT_PLAN } from '@blog/db/constants';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@blog/db/testing/tenant-analytics/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { saveTenantAnalytics } from './save-tenant-analytics';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.STARTER });

describe(saveTenantAnalytics, () => {
  describe('with a saved provider', () => {
    beforeEach(async () => {
      await saveTenantAnalytics(tenant().id, MOCK_GOOGLE_ANALYTICS);
    });

    it('stores one provider and id for the tenant', async () => {
      expect(await db().select().from(tenantAnalytics)).toEqual([
        expect.objectContaining({
          tenantId: tenant().id,
          ...MOCK_GOOGLE_ANALYTICS,
        }),
      ]);
    });

    it('replaces it when another provider is saved', async () => {
      await saveTenantAnalytics(tenant().id, MOCK_PLAUSIBLE_ANALYTICS);

      expect(await db().select().from(tenantAnalytics)).toEqual([
        expect.objectContaining(MOCK_PLAUSIBLE_ANALYTICS),
      ]);
    });
  });

  it('stores the id trimmed', async () => {
    await saveTenantAnalytics(tenant().id, {
      ...MOCK_PLAUSIBLE_ANALYTICS,
      analyticsId: ` ${MOCK_PLAUSIBLE_ANALYTICS.analyticsId} `,
    });

    expect(await db().select().from(tenantAnalytics)).toEqual([
      expect.objectContaining(MOCK_PLAUSIBLE_ANALYTICS),
    ]);
  });

  it('rejects a blank id', async () => {
    await expect(
      saveTenantAnalytics(tenant().id, {
        ...MOCK_PLAUSIBLE_ANALYTICS,
        analyticsId: ' ',
      }),
    ).rejects.toThrow();
  });
});
