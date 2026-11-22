import { LOCALE_ISO_CODES } from '@shinefold/config/constants';

import { formatStripeAmount } from './format-stripe-amount';

const MOCK_AMOUNT_PAID = 2_900;

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
