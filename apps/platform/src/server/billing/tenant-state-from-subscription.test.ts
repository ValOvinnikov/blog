import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import {
  BILLING_GRACE,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';

import type { TSubscribedPlan } from './plan-from-price-keys';
import { tenantStateFromSubscription } from './tenant-state-from-subscription';

const MOCK_SUBSCRIBED: TSubscribedPlan = {
  plan: TENANT_PLAN.GROWTH,
  subscriberBandCeiling: 2_500,
};

describe(tenantStateFromSubscription, () => {
  it.each([
    STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
    STRIPE_SUBSCRIPTION_STATUS.TRIALING,
  ])(
    'keeps the subscribed plan ACTIVE and ends any grace when %s',
    (status) => {
      expect(tenantStateFromSubscription(status, MOCK_SUBSCRIBED)).toEqual({
        ...MOCK_SUBSCRIBED,
        status: TENANT_STATUS.ACTIVE,
        grace: BILLING_GRACE.END,
      });
    },
  );

  it('keeps the subscribed plan PAST_DUE when a payment failed', () => {
    expect(
      tenantStateFromSubscription(
        STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
        MOCK_SUBSCRIBED,
      ),
    ).toEqual({
      ...MOCK_SUBSCRIBED,
      status: TENANT_STATUS.PAST_DUE,
      grace: BILLING_GRACE.KEEP,
    });
  });

  it.each([
    STRIPE_SUBSCRIPTION_STATUS.CANCELED,
    STRIPE_SUBSCRIPTION_STATUS.UNPAID,
    STRIPE_SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED,
  ])('moves the site to Free and starts the grace when %s', (status) => {
    expect(tenantStateFromSubscription(status, MOCK_SUBSCRIBED)).toEqual({
      plan: TENANT_PLAN.FREE,
      subscriberBandCeiling: null,
      status: TENANT_STATUS.ACTIVE,
      grace: BILLING_GRACE.START,
    });
  });

  it.each(['incomplete', 'paused'])('changes nothing while %s', (status) => {
    expect(
      tenantStateFromSubscription(status, MOCK_SUBSCRIBED),
    ).toBeUndefined();
  });
});
