import { ERROR_CODE, TENANT_PLAN } from '@shinefold/config/constants';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import { getTenantById } from '@shinefold/db/queries/tenants/get-tenant-by-id';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockStripeIds } from '@shinefold/db/testing/tenants/billing';
import { daysBeforeNow } from '@shinefold/db/testing/tenants/grace';
import { errorResult, okResult } from '@shinefold/utils';

import { setCancelledTenantFree } from './set-cancelled-tenant-free';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const [MOCK_BAND_CEILING] = PAID_SUBSCRIBER_BAND_CEILINGS;
const { stripeSubscriptionId: MOCK_SUBSCRIPTION_ID } = mockStripeIds();
const { stripeSubscriptionId: MOCK_OTHER_SUBSCRIPTION_ID } = mockStripeIds();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setCancelledTenantFree, () => {
  it.each([TENANT_STATUS.ACTIVE, TENANT_STATUS.SUSPENDED])(
    'moves a %s paying site to Free, keeping its status',
    async (status) => {
      const tenant = await insertTestTenant(db(), {
        plan: TENANT_PLAN.GROWTH,
        status,
        stripeSubscriptionId: MOCK_SUBSCRIPTION_ID,
        subscriberBandCeiling: MOCK_BAND_CEILING,
      });

      const result = await setCancelledTenantFree(
        tenant.id,
        MOCK_SUBSCRIPTION_ID,
      );

      expect(result).toEqual(okResult());
      expect(await getTenantById(tenant.id)).toMatchObject({
        plan: TENANT_PLAN.FREE,
        status,
        stripeSubscriptionId: MOCK_SUBSCRIPTION_ID,
        subscriberBandCeiling: null,
      });
    },
  );

  it('starts no downgrade grace and clears one already running', async () => {
    const tenant = await insertTestTenant(db(), {
      plan: TENANT_PLAN.STARTER,
      stripeSubscriptionId: MOCK_SUBSCRIPTION_ID,
      downgradeGraceStartedAt: daysBeforeNow(3),
    });

    await setCancelledTenantFree(tenant.id, MOCK_SUBSCRIPTION_ID);

    expect(await getTenantById(tenant.id)).toMatchObject({
      downgradeGraceStartedAt: null,
      downgradedFromPlan: null,
    });
  });

  it('leaves a site that stores another subscription', async () => {
    const tenant = await insertTestTenant(db(), {
      plan: TENANT_PLAN.GROWTH,
      stripeSubscriptionId: MOCK_OTHER_SUBSCRIPTION_ID,
    });

    const result = await setCancelledTenantFree(
      tenant.id,
      MOCK_SUBSCRIPTION_ID,
    );

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
    expect(await getTenantById(tenant.id)).toMatchObject({
      plan: TENANT_PLAN.GROWTH,
    });
  });
});
