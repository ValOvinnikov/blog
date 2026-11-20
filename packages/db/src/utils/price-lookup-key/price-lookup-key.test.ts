import { BILLING_INTERVAL, TENANT_PLAN } from '@shinefold/config/constants';
import {
  STRIPE_PRICE_LOOKUP_KEY,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';

import { bandKeyFor, lookupKeyFor } from './price-lookup-key';

const MOCK_BAND_CEILING: TPaidSubscriberBandCeiling = 2_500;
const MOCK_INTERVAL_KEYS = {
  monthly: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
  yearly: STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
};

describe(lookupKeyFor, () => {
  it.each([
    [BILLING_INTERVAL.MONTHLY, STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY],
    [BILLING_INTERVAL.YEARLY, STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY],
  ])('names the %s key', (interval, key) => {
    expect(lookupKeyFor(MOCK_INTERVAL_KEYS, interval)).toBe(key);
  });
});

describe(bandKeyFor, () => {
  it('names the band Price for the period on a plan with bands', () => {
    expect(
      bandKeyFor(
        TENANT_PLAN.GROWTH,
        BILLING_INTERVAL.YEARLY,
        MOCK_BAND_CEILING,
      ),
    ).toBe(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY);
  });

  it.each([
    ['a plan without bands', TENANT_PLAN.STARTER, MOCK_BAND_CEILING],
    ['the included band', TENANT_PLAN.GROWTH, null],
  ])('names none for %s', (_case, plan, ceiling) => {
    expect(bandKeyFor(plan, BILLING_INTERVAL.MONTHLY, ceiling)).toBeUndefined();
  });
});
