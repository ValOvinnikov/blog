import { ANALYTICS_PROVIDER } from '@blog/config/constants';
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

  it('stores a Plausible domain trimmed and lowercased', async () => {
    await saveTenantAnalytics(tenant().id, {
      ...MOCK_PLAUSIBLE_ANALYTICS,
      analyticsId: ` ${MOCK_PLAUSIBLE_ANALYTICS.analyticsId.toUpperCase()} `,
    });

    expect(await db().select().from(tenantAnalytics)).toEqual([
      expect.objectContaining(MOCK_PLAUSIBLE_ANALYTICS),
    ]);
  });

  it.each([
    [
      'a Google Analytics id without the G- prefix',
      ANALYTICS_PROVIDER.GOOGLE_ANALYTICS,
      MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
    ],
    [
      'a lowercase Google Analytics id',
      ANALYTICS_PROVIDER.GOOGLE_ANALYTICS,
      MOCK_GOOGLE_ANALYTICS.analyticsId.toLowerCase(),
    ],
    [
      'a Plausible URL instead of a bare domain',
      ANALYTICS_PROVIDER.PLAUSIBLE,
      `https://${MOCK_PLAUSIBLE_ANALYTICS.analyticsId}`,
    ],
    [
      'a Plausible id holding markup',
      ANALYTICS_PROVIDER.PLAUSIBLE,
      `${MOCK_PLAUSIBLE_ANALYTICS.analyticsId}"><script>`,
    ],
    ['a blank id', ANALYTICS_PROVIDER.PLAUSIBLE, ' '],
  ])('rejects %s and stores nothing', async (_, provider, analyticsId) => {
    await expect(
      saveTenantAnalytics(tenant().id, { provider, analyticsId }),
    ).rejects.toThrow();
    expect(await db().select().from(tenantAnalytics)).toEqual([]);
  });
});
