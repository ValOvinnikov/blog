import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import { mockPlanSubscription } from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { readTenantSubscriptionPlan } from './read-tenant-subscription-plan';
import { getStripeClient } from './stripe-client';

vi.mock('./stripe-client', () => ({ getStripeClient: vi.fn() }));

const read = () =>
  readTenantSubscriptionPlan(MOCK_TENANT_ID, MOCK_STRIPE_SUBSCRIPTION_ID);

const withPlanKey = (planKey: string) => {
  const client = mockStripePlanChangeClient(mockPlanSubscription({ planKey }));
  vi.mocked(getStripeClient).mockReturnValue(client.stripe);
  return client;
};

describe(readTenantSubscriptionPlan, () => {
  it('reads the subscription with the Stripe client', async () => {
    const { stripe } = withPlanKey(STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY);

    const result = await read();

    expect(result?.stripe).toBe(stripe);
    expect(result?.subscription.id).toBe(MOCK_STRIPE_SUBSCRIPTION_ID);
  });

  it('logs when Stripe is not configured', async () => {
    vi.mocked(getStripeClient).mockReturnValue(undefined);

    const result = await read();

    expect(result).toBeUndefined();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.STRIPE_UNCONFIGURED,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('logs a subscription on an unknown Price', async () => {
    withPlanKey('SOMETHING_ELSE');

    const result = await read();

    expect(result).toBeUndefined();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PRICE_UNKNOWN,
      { tenantId: MOCK_TENANT_ID, subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID },
    );
  });

  it('logs a failed Stripe read', async () => {
    const { retrieveSubscription } = withPlanKey(
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    );
    retrieveSubscription.mockRejectedValue(new Error('network'));

    const result = await read();

    expect(result).toBeUndefined();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_LOAD_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
