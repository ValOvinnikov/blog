import { BILLING_CURRENCY } from '@blog/db/constants';
import { MOCK_UNLISTED_CURRENCY } from '@web/testing/modules/pricing/live-price-fixtures';

import { isBillingCurrency } from './is-billing-currency';

describe(isBillingCurrency, () => {
  it.each([
    { value: BILLING_CURRENCY.GBP, expected: true },
    { value: MOCK_UNLISTED_CURRENCY, expected: false },
    { value: undefined, expected: false },
  ])('is $expected for $value', ({ value, expected }) => {
    expect(isBillingCurrency(value)).toBe(expected);
  });
});
