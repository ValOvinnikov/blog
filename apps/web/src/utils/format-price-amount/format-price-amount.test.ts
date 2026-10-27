import { faker } from '@faker-js/faker';

import { formatPriceAmount } from './format-price-amount';

faker.seed(112);

const MOCK_FREE_LABEL = faker.lorem.word();
const GBP = { currency: 'GBP', locale: 'en-GB' };
const JPY = { currency: 'JPY', locale: 'ja-JP' };

const format = (amount: number, { currency, locale } = GBP) =>
  formatPriceAmount({ amount, locale, currency, freeLabel: MOCK_FREE_LABEL });

describe(formatPriceAmount, () => {
  it.each([
    {
      case: 'strips the decimals from a whole amount',
      amount: 49,
      expected: '£49',
    },
    {
      case: 'keeps two decimals for a fractional amount',
      amount: 49.99,
      expected: '£49.99',
    },
  ])('$case', ({ amount, expected }) => {
    expect(format(amount)).toBe(expected);
  });

  it('returns the free label for zero', () => {
    expect(format(0)).toBe(MOCK_FREE_LABEL);
  });

  it("uses the currency's own minor units", () => {
    expect(format(5000, JPY)).toBe('￥5,000');
  });
});
