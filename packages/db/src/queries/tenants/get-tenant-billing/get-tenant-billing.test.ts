import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mockTenantBilling } from '@blog/db/testing/tenants/billing';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { getTenantBilling } from './get-tenant-billing';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantBilling, () => {
  it('reads every field as undefined for a tenant with no billing recorded', async () => {
    const { id } = await insertTestTenant(db());

    const result = await getTenantBilling(id);

    expect(result).toEqual({
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
      stripePromotionCode: undefined,
      subscriberBandCeiling: undefined,
      trialEndsAt: undefined,
      downgradeGraceStartedAt: undefined,
      graceStartedEmailSentAt: undefined,
      graceHalfwayEmailSentAt: undefined,
      graceEndingEmailSentAt: undefined,
    });
  });

  it('reads the stored billing', async () => {
    const billing = mockTenantBilling();
    const { id } = await insertTestTenant(db(), billing);

    const result = await getTenantBilling(id);

    expect(result).toEqual(billing);
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantBilling(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
