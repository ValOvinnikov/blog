import { validatePricingTierPriceLabelRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-price-label-required/validate-pricing-tier-price-label-required';
import type { ValidationContext } from 'sanity';

const PRICE_LABEL_REQUIRED_MESSAGE = 'Add a label when the tier has no prices.';

const buildContext = (prices?: unknown[]): ValidationContext =>
  ({ parent: { prices } }) as unknown as ValidationContext;

describe(validatePricingTierPriceLabelRequired, () => {
  it.each([
    ['the tier has prices and no label', [{ period: 'MONTH' }], undefined],
    ['the tier has prices and a label', [{ period: 'MONTH' }], 'Custom'],
    ['the tier has no prices but has a label', [], 'Contact us'],
  ])('passes when %s', (_description, prices, priceLabel) => {
    expect(
      validatePricingTierPriceLabelRequired(priceLabel, buildContext(prices)),
    ).toBe(true);
  });

  it('fails with the required-label message when there are no prices and no label', () => {
    expect(
      validatePricingTierPriceLabelRequired(undefined, buildContext([])),
    ).toBe(PRICE_LABEL_REQUIRED_MESSAGE);
  });

  it('fails with the required-label message when prices is undefined and no label', () => {
    expect(
      validatePricingTierPriceLabelRequired(undefined, buildContext(undefined)),
    ).toBe(PRICE_LABEL_REQUIRED_MESSAGE);
  });
});
