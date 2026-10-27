import { PRICE_PERIOD } from '@blog/config/constants';
import { validatePricingPricePeriodsUnique } from '@blog/studio/schema-types/validation/validate-pricing-price-periods-unique/validate-pricing-price-periods-unique';

const PERIOD_DUPLICATE_MESSAGE =
  'Each price period can only be used once per tier.';

describe(validatePricingPricePeriodsUnique, () => {
  it.each([
    ['passes when no prices are given', undefined, true],
    ['passes when there are no prices', [], true],
    [
      'passes when every price uses a different period',
      [{ period: PRICE_PERIOD.MONTH }, { period: PRICE_PERIOD.YEAR }],
      true,
    ],
    [
      'fails when two prices share a period',
      [{ period: PRICE_PERIOD.MONTH }, { period: PRICE_PERIOD.MONTH }],
      PERIOD_DUPLICATE_MESSAGE,
    ],
  ])('%s', (_description, prices, expected) => {
    expect(validatePricingPricePeriodsUnique(prices)).toBe(expected);
  });
});
