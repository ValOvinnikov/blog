import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import type {
  TPricingModule,
  TPricingPrice,
  TPricingTier,
} from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makePricingPrice = (
  overrides: Partial<TPricingPrice> = {},
): TPricingPrice => ({
  period: PRICE_PERIOD.MONTH,
  amount: 49,
  compareAtAmount: undefined,
  isStartingAt: false,
  ...overrides,
});

export const makePricingTier = (
  overrides: Partial<TPricingTier> = {},
): TPricingTier => ({
  id: 'tier-1',
  name: 'Starter',
  description: undefined,
  prices: [makePricingPrice()],
  priceLabel: undefined,
  features: [],
  ctaButtons: [],
  highlightLabel: undefined,
  footnote: undefined,
  ...overrides,
});

export const makePricingModule = (
  overrides: Partial<TPricingModule> = {},
): TPricingModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Pricing' }),
  tiers: [makePricingTier()],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
