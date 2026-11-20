import {
  MOCK_BAND_2500_AMOUNT,
  MOCK_BAND_2500_YEARLY_AMOUNT,
  MOCK_BAND_5000_AMOUNT,
  MOCK_GROWTH_CATALOGUE,
  MOCK_GROWTH_MONTHLY_AMOUNT,
} from '@platform/testing/billing/catalogue-prices';
import { BILLING_INTERVAL, TENANT_PLAN } from '@shinefold/config/constants';
import { BILLING_CURRENCY } from '@shinefold/db/constants';

import {
  moveUpOfferFor,
  planTotalFor,
  type TMoveUpBilling,
} from './move-up-offer';

const GROWTH_MONTHLY: TMoveUpBilling = {
  plan: TENANT_PLAN.GROWTH,
  subscriberBandCeiling: null,
  billingInterval: BILLING_INTERVAL.MONTHLY,
  billingCurrency: BILLING_CURRENCY.USD,
};

describe(moveUpOfferFor, () => {
  it('prices the first band whole for a site on the included band', () => {
    expect(moveUpOfferFor(GROWTH_MONTHLY, MOCK_GROWTH_CATALOGUE)).toEqual({
      ceiling: 2_500,
      allowance: 15_000,
      interval: BILLING_INTERVAL.MONTHLY,
      extra: {
        minorUnits: MOCK_BAND_2500_AMOUNT,
        currency: BILLING_CURRENCY.USD,
      },
    });
  });

  it('prices the difference between the next band and the current one', () => {
    const offer = moveUpOfferFor(
      { ...GROWTH_MONTHLY, subscriberBandCeiling: 2_500 },
      MOCK_GROWTH_CATALOGUE,
    );

    expect(offer?.extra.minorUnits).toBe(
      MOCK_BAND_5000_AMOUNT - MOCK_BAND_2500_AMOUNT,
    );
  });

  it('prices on the yearly period', () => {
    const offer = moveUpOfferFor(
      { ...GROWTH_MONTHLY, billingInterval: BILLING_INTERVAL.YEARLY },
      MOCK_GROWTH_CATALOGUE,
    );

    expect(offer).toMatchObject({
      interval: BILLING_INTERVAL.YEARLY,
      extra: { minorUnits: MOCK_BAND_2500_YEARLY_AMOUNT },
    });
  });

  it.each([
    ['the largest band', { subscriberBandCeiling: 25_000 }],
    ['no stored currency', { billingCurrency: null }],
    ['no stored billing period', { billingInterval: null }],
    [
      'a currency the catalogue lacks',
      { billingCurrency: BILLING_CURRENCY.EUR },
    ],
    ['a Starter site', { plan: TENANT_PLAN.STARTER }],
  ] as const)('offers nothing for %s', (_case, billing) => {
    expect(
      moveUpOfferFor({ ...GROWTH_MONTHLY, ...billing }, MOCK_GROWTH_CATALOGUE),
    ).toBeUndefined();
  });
});

describe(planTotalFor, () => {
  const pricing = {
    plan: TENANT_PLAN.GROWTH,
    interval: BILLING_INTERVAL.MONTHLY,
    currency: BILLING_CURRENCY.USD,
  };

  it('adds the band to the plan price', () => {
    expect(planTotalFor(MOCK_GROWTH_CATALOGUE, pricing, 2_500)).toEqual({
      minorUnits: MOCK_GROWTH_MONTHLY_AMOUNT + MOCK_BAND_2500_AMOUNT,
      currency: BILLING_CURRENCY.USD,
    });
  });

  it('has no total when the band has no price', () => {
    expect(
      planTotalFor(MOCK_GROWTH_CATALOGUE, pricing, 10_000),
    ).toBeUndefined();
  });
});
