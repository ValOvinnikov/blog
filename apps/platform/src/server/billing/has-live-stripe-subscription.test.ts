import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import { SUBSCRIPTION_LIFECYCLE_LOG } from '@platform/constants/subscription-lifecycle';
import { MOCK_STRIPE_CUSTOMER_ID } from '@platform/testing/billing/fixtures';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import { hasLiveStripeSubscription } from './has-live-stripe-subscription';
import { getStripeClient } from './stripe-client';

vi.mock('./stripe-client');

const customerTenant = mockTenant({
  stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
});

const mockListedStatuses = (...statuses: string[]) => {
  const list = vi.fn(() => statuses.map((status) => ({ status })));
  vi.mocked(getStripeClient).mockReturnValue({
    subscriptions: { list },
  } as unknown as Stripe);
  return list;
};

describe(hasLiveStripeSubscription, () => {
  it.each([
    STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
    STRIPE_SUBSCRIPTION_STATUS.TRIALING,
    STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
  ])('reports a %s subscription for the customer as live', async (status) => {
    const list = mockListedStatuses(
      STRIPE_SUBSCRIPTION_STATUS.CANCELED,
      status,
    );

    await expect(hasLiveStripeSubscription(customerTenant)).resolves.toBe(true);
    expect(list).toHaveBeenCalledWith({ customer: MOCK_STRIPE_CUSTOMER_ID });
  });

  it('reports no live subscription when every one has ended', async () => {
    mockListedStatuses(
      STRIPE_SUBSCRIPTION_STATUS.CANCELED,
      STRIPE_SUBSCRIPTION_STATUS.UNPAID,
    );

    await expect(hasLiveStripeSubscription(customerTenant)).resolves.toBe(
      false,
    );
  });

  it('does not ask Stripe about a site with no customer', async () => {
    const list = mockListedStatuses(STRIPE_SUBSCRIPTION_STATUS.ACTIVE);

    await expect(hasLiveStripeSubscription(mockTenant())).resolves.toBe(false);
    expect(list).not.toHaveBeenCalled();
  });

  it('gives no answer, and logs, when the list fails', async () => {
    mockListedStatuses().mockImplementationOnce(() => {
      throw MOCK_NETWORK_ERROR;
    });

    await expect(
      hasLiveStripeSubscription(customerTenant),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      SUBSCRIPTION_LIFECYCLE_LOG.LIVE_CHECK_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('gives no answer, and logs, when Stripe has no key', async () => {
    vi.mocked(getStripeClient).mockReturnValue(undefined);

    await expect(
      hasLiveStripeSubscription(customerTenant),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });
});
