import { LOCALE_ISO_CODES, PRICE_PERIOD } from '@blog/config/constants';
import { validatePricingTierPriceLabelRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-price-label-required/validate-pricing-tier-price-label-required';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import type { ValidationContext } from 'sanity';

faker.seed(6024);

const { EN, NL } = LOCALE_ISO_CODES;

const PRICE_LABEL_REQUIRED_MESSAGE = 'Add a label when the tier has no prices.';

const MOCK_PRICES = [{ period: PRICE_PERIOD.MONTH }];
const MOCK_ENGLISH_LABEL = [mockLocalizedValue(EN, faker.lorem.words())];
const MOCK_DUTCH_LABEL = [mockLocalizedValue(NL, faker.lorem.words())];

const contextWithPrices = (prices?: unknown[]): ValidationContext =>
  ({ parent: { prices } }) as unknown as ValidationContext;

describe(validatePricingTierPriceLabelRequired, () => {
  it.each([
    [
      'passes when the tier has prices and no label',
      MOCK_PRICES,
      undefined,
      true,
    ],
    [
      'passes when the tier has prices and a label',
      MOCK_PRICES,
      MOCK_ENGLISH_LABEL,
      true,
    ],
    [
      'passes when the tier has no prices but a default-language label',
      [],
      MOCK_ENGLISH_LABEL,
      true,
    ],
    [
      'fails when the tier has no prices and no label',
      [],
      undefined,
      PRICE_LABEL_REQUIRED_MESSAGE,
    ],
    [
      'fails when the tier has no prices set and no label',
      undefined,
      undefined,
      PRICE_LABEL_REQUIRED_MESSAGE,
    ],
    [
      'fails when the label is only in another language',
      [],
      MOCK_DUTCH_LABEL,
      PRICE_LABEL_REQUIRED_MESSAGE,
    ],
  ])('%s', (_description, prices, priceLabel, expected) => {
    expect(
      validatePricingTierPriceLabelRequired(
        priceLabel,
        contextWithPrices(prices),
      ),
    ).toBe(expected);
  });
});
