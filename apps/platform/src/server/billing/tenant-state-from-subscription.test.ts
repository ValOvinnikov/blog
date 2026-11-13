import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import {
  BILLING_GRACE,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_BAND_CEILING,
  MOCK_INCOMPLETE_SUBSCRIPTION_STATUS,
} from '@platform/testing/billing/fixtures';

import type { TSubscribedPlan } from './plan-from-price-keys';
import { tenantStateFromSubscription } from './tenant-state-from-subscription';

const MOCK_SUBSCRIBED: TSubscribedPlan = {
  plan: TENANT_PLAN.GROWTH,
  subscriberBandCeiling: MOCK_BAND_CEILING,
};

describe(tenantStateFromSubscription, () => {
  it.each([
    STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
    STRIPE_SUBSCRIPTION_STATUS.TRIALING,
  ])(
    'keeps the subscribed plan ACTIVE and ends any grace when %s',
    (status) => {
      expect(
        tenantStateFromSubscription(status, MOCK_SUBSCRIBED, TENANT_PLAN.FREE),
      ).toEqual({
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
        TENANT_PLAN.GROWTH,
      ),
    ).toEqual({
      ...MOCK_SUBSCRIBED,
      status: TENANT_STATUS.PAST_DUE,
      grace: BILLING_GRACE.KEEP,
    });
  });

  describe.each([
    STRIPE_SUBSCRIPTION_STATUS.CANCELED,
    STRIPE_SUBSCRIPTION_STATUS.UNPAID,
  ])('a %s subscription', (status) => {
    it('moves a paid site to Free and starts the grace', () => {
      expect(
        tenantStateFromSubscription(
          status,
          MOCK_SUBSCRIBED,
          TENANT_PLAN.GROWTH,
        ),
      ).toEqual({
        plan: TENANT_PLAN.FREE,
        subscriberBandCeiling: null,
        status: TENANT_STATUS.ACTIVE,
        grace: BILLING_GRACE.START,
      });
    });

    it('starts no grace for a site already on Free', () => {
      expect(
        tenantStateFromSubscription(status, MOCK_SUBSCRIBED, TENANT_PLAN.FREE),
      ).toMatchObject({ plan: TENANT_PLAN.FREE, grace: BILLING_GRACE.KEEP });
    });
  });

  it.each([
    MOCK_INCOMPLETE_SUBSCRIPTION_STATUS,
    'incomplete_expired',
    'paused',
  ])('changes nothing for a subscription that is %s', (status) => {
    expect(
      tenantStateFromSubscription(status, MOCK_SUBSCRIBED, TENANT_PLAN.FREE),
    ).toBeUndefined();
  });
});
