import { BILLING_CURRENCY, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_STRIPE_PRODUCT_ID,
  MOCK_UNKNOWN_LOOKUP_KEY,
  mockStripeCataloguePrice,
} from '@platform/testing/billing/catalogue';
import { MOCK_STRIPE_PRICE_ID } from '@platform/testing/billing/fixtures';

import { toCataloguePrice } from './to-catalogue-price';

describe(toCataloguePrice, () => {
  it('keeps the amount of every billing currency the Price carries', () => {
    expect(toCataloguePrice(mockStripeCataloguePrice())).toEqual({
      lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
      stripePriceId: MOCK_STRIPE_PRICE_ID,
      stripeProductId: MOCK_STRIPE_PRODUCT_ID,
      amounts: [
        { currency: BILLING_CURRENCY.EUR, unitAmount: MOCK_EURO_AMOUNT },
        { currency: BILLING_CURRENCY.USD, unitAmount: MOCK_DOLLAR_AMOUNT },
      ],
    });
  });

  it.each([
    ['an archived Price', { active: false }],
    ['a Price with no lookup key', { lookup_key: null }],
    [
      'a Price whose lookup key is not a plan key',
      { lookup_key: MOCK_UNKNOWN_LOOKUP_KEY },
    ],
  ])('leaves out %s', (_description, overrides) => {
    expect(
      toCataloguePrice(mockStripeCataloguePrice(overrides)),
    ).toBeUndefined();
  });
});
