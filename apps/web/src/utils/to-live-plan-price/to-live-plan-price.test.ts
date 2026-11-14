import { PRICE_PERIOD } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { BILLING_CURRENCY, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_STRIPE_PRODUCT_ID,
} from '@blog/db/testing/stripe-catalogue/fixtures';
import {
  mockPricingTier,
  MOCK_PRICING_LABELS,
} from '@web/testing/modules/pricing/fixtures';
import { mockStripePrice } from '@web/testing/modules/pricing/live-price-fixtures';

import { toLivePlanPrice } from './to-live-plan-price';

const { periods } = MOCK_PRICING_LABELS;

const MOCK_DOLLAR_PRICE = mockStripePrice();
const MOCK_EURO_PRICE = mockStripePrice({
  currency: BILLING_CURRENCY.EUR,
  unitAmount: MOCK_EURO_AMOUNT,
});
const MOCK_YEARLY_DOLLAR_PRICE = mockStripePrice({
  lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
  unitAmount: MOCK_EURO_AMOUNT,
});

const linkedTier = (
  interval: typeof PRICE_PERIOD.MONTH | typeof PRICE_PERIOD.YEAR,
) =>
  mockPricingTier({
    platformPlan: { plan: TENANT_PLAN.GROWTH, interval },
    prices: [],
  });

const setup = (
  overrides: Partial<Parameters<typeof toLivePlanPrice>[0]> = {},
) =>
  toLivePlanPrice({
    tier: linkedTier(PRICE_PERIOD.MONTH),
    planPrices: [MOCK_DOLLAR_PRICE, MOCK_EURO_PRICE, MOCK_YEARLY_DOLLAR_PRICE],
    siteCurrency: BILLING_CURRENCY.EUR,
    periods,
    ...overrides,
  });

describe(toLivePlanPrice, () => {
  it('collects the plan interval price in every listed currency', () => {
    expect(setup()).toEqual({
      period: periods[PRICE_PERIOD.MONTH],
      defaultCurrency: BILLING_CURRENCY.EUR,
      amounts: {
        [BILLING_CURRENCY.USD]: {
          unitAmount: MOCK_DOLLAR_AMOUNT,
          productId: MOCK_STRIPE_PRODUCT_ID,
        },
        [BILLING_CURRENCY.EUR]: {
          unitAmount: MOCK_EURO_AMOUNT,
          productId: MOCK_STRIPE_PRODUCT_ID,
        },
      },
    });
  });

  it('reads the yearly lookup key for a yearly tier', () => {
    const livePrice = setup({ tier: linkedTier(PRICE_PERIOD.YEAR) });

    expect(livePrice?.period).toBe(periods[PRICE_PERIOD.YEAR]);
    expect(livePrice?.amounts[BILLING_CURRENCY.USD]?.unitAmount).toBe(
      MOCK_EURO_AMOUNT,
    );
  });

  it.each([
    {
      case: 'the site currency is not a billing currency',
      siteCurrency: 'JPY',
      planPrices: [MOCK_DOLLAR_PRICE, MOCK_EURO_PRICE],
      expected: BILLING_CURRENCY.USD,
    },
    {
      case: 'the site currency has no price',
      siteCurrency: BILLING_CURRENCY.GBP,
      planPrices: [MOCK_EURO_PRICE],
      expected: BILLING_CURRENCY.EUR,
    },
  ])(
    'defaults to $expected when $case',
    ({ siteCurrency, planPrices, expected }) => {
      expect(setup({ siteCurrency, planPrices })?.defaultCurrency).toBe(
        expected,
      );
    },
  );

  it('has no live price when the catalogue lists none for the plan', () => {
    expect(setup({ planPrices: [MOCK_YEARLY_DOLLAR_PRICE] })).toBeUndefined();
  });

  it('has no live price for an unlinked tier', () => {
    expect(setup({ tier: mockPricingTier() })).toBeUndefined();
  });
});
