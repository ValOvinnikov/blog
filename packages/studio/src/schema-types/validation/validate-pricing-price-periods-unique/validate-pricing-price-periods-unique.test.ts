import { PRICE_PERIOD } from '@blog/config/constants';
import { validatePricingPricePeriodsUnique } from '@blog/studio/schema-types/validation/validate-pricing-price-periods-unique/validate-pricing-price-periods-unique';

const PERIOD_DUPLICATE_MESSAGE =
  'Each price period can only be used once per tier.';

describe(validatePricingPricePeriodsUnique, () => {
  it.each([
    ['no prices are given', undefined],
    ['prices is empty', []],
    [
      'every price uses a different period',
      [{ period: PRICE_PERIOD.MONTH }, { period: PRICE_PERIOD.YEAR }],
    ],
  ])('passes when %s', (_description, prices) => {
    expect(validatePricingPricePeriodsUnique(prices)).toBe(true);
  });

  it('fails with the duplicate-period message when two prices share a period', () => {
    expect(
      validatePricingPricePeriodsUnique([
        { period: PRICE_PERIOD.MONTH },
        { period: PRICE_PERIOD.MONTH },
      ]),
    ).toBe(PERIOD_DUPLICATE_MESSAGE);
  });
});
