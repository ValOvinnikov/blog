import {
  STRIPE_CHECKOUT_SESSION_STATUS,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_CHECKOUT_SESSION_ID,
  MOCK_STRIPE_CUSTOMER_ID,
} from '@platform/testing/billing/fixtures';
import { mockStripeCheckoutClient } from '@platform/testing/billing/stripe-checkout-client';

import {
  expireOpenCheckouts,
  hasLiveSubscription,
} from './prepare-customer-checkout';

const { stripe, listSubscriptions, listSessions, expireSession } =
  mockStripeCheckoutClient();

describe(hasLiveSubscription, () => {
  it.each([
    [STRIPE_SUBSCRIPTION_STATUS.ACTIVE, true],
    [STRIPE_SUBSCRIPTION_STATUS.PAST_DUE, true],
    [STRIPE_SUBSCRIPTION_STATUS.CANCELED, false],
  ])('treats a %s subscription as live: %s', async (status, expected) => {
    listSubscriptions.mockResolvedValueOnce({ data: [{ status }] });

    const isLive = await hasLiveSubscription(stripe, MOCK_STRIPE_CUSTOMER_ID);

    expect(isLive).toBe(expected);
  });
});

describe(expireOpenCheckouts, () => {
  it("expires the customer's open checkouts", async () => {
    listSessions.mockResolvedValueOnce({
      data: [{ id: MOCK_CHECKOUT_SESSION_ID }],
    });

    await expireOpenCheckouts(stripe, MOCK_STRIPE_CUSTOMER_ID);

    const [listParams] = listSessions.mock.calls[0]!;
    expect(listParams).toEqual({
      customer: MOCK_STRIPE_CUSTOMER_ID,
      status: STRIPE_CHECKOUT_SESSION_STATUS.OPEN,
      limit: 100,
    });
    expect(expireSession).toHaveBeenCalledWith(MOCK_CHECKOUT_SESSION_ID);
  });
});
