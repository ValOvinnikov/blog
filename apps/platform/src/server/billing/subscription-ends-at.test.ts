import { STRIPE_SUBSCRIPTION_STATUS } from '@platform/constants/billing';
import {
  MOCK_CANCEL_AT,
  MOCK_ENDS_AT,
  MOCK_RENEWS_AT,
} from '@platform/testing/billing/plan-subscription';
import { mockStripeSubscription } from '@platform/testing/billing/stripe-subscription';

import { subscriptionEndsAt } from './subscription-ends-at';

describe(subscriptionEndsAt, () => {
  it('ends a subscription the Portal cancelled on its cancel date', () => {
    const endsAt = subscriptionEndsAt(
      mockStripeSubscription({ cancelAt: MOCK_CANCEL_AT }),
    );

    expect(endsAt).toEqual(MOCK_ENDS_AT);
  });

  it('ends a subscription set to cancel at period end when its period ends', () => {
    const endsAt = subscriptionEndsAt(
      mockStripeSubscription({ cancelAtPeriodEnd: true }),
    );

    expect(endsAt).toEqual(MOCK_RENEWS_AT);
  });

  it('prefers the cancel date when both are set', () => {
    const endsAt = subscriptionEndsAt(
      mockStripeSubscription({
        cancelAt: MOCK_CANCEL_AT,
        cancelAtPeriodEnd: true,
      }),
    );

    expect(endsAt).toEqual(MOCK_ENDS_AT);
  });

  it('ends nothing for a subscription that has already ended', () => {
    const endsAt = subscriptionEndsAt(
      mockStripeSubscription({
        status: STRIPE_SUBSCRIPTION_STATUS.CANCELED,
        cancelAt: MOCK_CANCEL_AT,
      }),
    );

    expect(endsAt).toBeUndefined();
  });

  it('ends nothing for a renewing subscription', () => {
    const endsAt = subscriptionEndsAt(mockStripeSubscription());

    expect(endsAt).toBeUndefined();
  });
});
