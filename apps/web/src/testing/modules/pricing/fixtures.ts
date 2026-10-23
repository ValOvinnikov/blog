import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import type {
  TPricingModule,
  TPricingPrice,
  TPricingTier,
} from '@blog/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { IPricingLabels } from '@web/utils/to-pricing-panels';

export const mockPricingPrice = (
  overrides: Partial<TPricingPrice> = {},
): TPricingPrice => ({
  period: PRICE_PERIOD.MONTH,
  amount: 49,
  compareAtAmount: undefined,
  isStartingAt: false,
  ...overrides,
});

export const mockPricingTier = (
  overrides: Partial<TPricingTier> = {},
): TPricingTier => ({
  id: 'tier-1',
  name: 'Starter',
  description: undefined,
  prices: [mockPricingPrice()],
  priceLabel: undefined,
  features: [],
  ctaButtons: [],
  highlightLabel: undefined,
  footnote: undefined,
  ...overrides,
});

export const mockPricingModule = (
  overrides: Partial<TPricingModule> = {},
): TPricingModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: 'Pricing' }),
  tiers: [mockPricingTier()],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});

export const MOCK_PRICING_LABELS: IPricingLabels = {
  free: 'Free',
  compareAtLabel: 'Regular price',
  from: 'From',
  periods: {
    [PRICE_PERIOD.ONE_TIME]: 'one-time',
    [PRICE_PERIOD.HOUR]: 'per hour',
    [PRICE_PERIOD.SESSION]: 'per session',
    [PRICE_PERIOD.MONTH]: 'per month',
    [PRICE_PERIOD.YEAR]: 'per year',
  },
};
