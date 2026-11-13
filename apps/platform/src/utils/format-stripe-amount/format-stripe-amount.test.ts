import { LOCALE_ISO_CODES } from '@blog/config';
import { MOCK_AMOUNT_PAID } from '@platform/testing/billing/fixtures';

import { formatStripeAmount } from './format-stripe-amount';

describe(formatStripeAmount, () => {
  it.each([
    ['eur', '€29.00'],
    ['gbp', '£29.00'],
    ['usd', '$29.00'],
    ['jpy', '¥2,900'],
  ])('formats minor units of %s as a major amount', (currency, expected) => {
    expect(
      formatStripeAmount(
        { minorUnits: MOCK_AMOUNT_PAID, currency },
        LOCALE_ISO_CODES.EN,
      ),
    ).toBe(expected);
  });
});
