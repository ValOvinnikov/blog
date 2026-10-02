import { formatPriceAmount } from './format-price-amount';

const format = (amount: number, currency = 'GBP', locale = 'en-GB') =>
  formatPriceAmount({ amount, locale, currency, freeLabel: 'Free' });

describe(formatPriceAmount.name, () => {
  it('strips the decimals from a whole amount', () => {
    expect(format(49)).toBe('£49');
  });

  it('keeps two decimals for a fractional amount', () => {
    expect(format(49.99)).toBe('£49.99');
  });

  it('returns the free label for zero', () => {
    expect(format(0)).toBe('Free');
  });

  it('uses the currency own minor units', () => {
    expect(format(5000, 'JPY', 'ja-JP')).toBe('￥5,000');
  });
});
