import { LOCALE_ISO_CODES } from '@blog/config';

import { formatStripeAmount } from './format-stripe-amount';

const MOCK_MINOR_UNITS = 2900;

describe(formatStripeAmount, () => {
  it.each([
    ['eur', '€29.00'],
    ['gbp', '£29.00'],
    ['usd', '$29.00'],
  ])('formats minor units of %s as a major amount', (currency, expected) => {
    expect(
      formatStripeAmount(
        { minorUnits: MOCK_MINOR_UNITS, currency },
        LOCALE_ISO_CODES.EN,
      ),
    ).toBe(expected);
  });
});
