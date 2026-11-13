import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import type { TRawPricingModule } from '@blog/service/features/modules/pricing/adaptor/transformer';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

export const MOCK_PRICING_MODULE_ID = 'pricing-1';
export const MOCK_UNLIMITED_POSTS_FEATURE = 'Unlimited posts';
export const MOCK_PRIORITY_SUPPORT_FEATURE = 'Priority support';
export const MOCK_PRICING_FEATURE_KEY = 'feature-1';
export const MOCK_SECOND_PRICING_FEATURE_KEY = 'feature-2';
export const MOCK_PRICING_FOOTNOTE = 'Prices exclude VAT.';
export const MOCK_PRICING_HIGHLIGHT_LABEL = 'Most popular';
export const MOCK_PRICING_TIER_DESCRIPTION = 'For growing teams';
export const MOCK_PRICING_TIER_FOOTNOTE = 'Billed annually';
export const MOCK_PRICING_TIER_ID = 'tier-pro';
export const MOCK_PRICING_TIER_NAME = 'Pro';

type TRawPricingTier = NonNullable<TRawPricingModule['tiers']>[number];
type TRawPricingPrice = NonNullable<TRawPricingTier['prices']>[number];

export function mockRawPricingPrice(
  overrides: Partial<TRawPricingPrice> = {},
): TRawPricingPrice {
  return {
    _key: 'price-1',
    period: PRICE_PERIOD.MONTH,
    amount: 29,
    compareAtAmount: null,
    isStartingAt: null,
    ...overrides,
  };
}

export function mockRawPricingTier(
  overrides: Partial<TRawPricingTier> = {},
): TRawPricingTier {
  return {
    _key: 'tier-1',
    platformPlan: null,
    platformPlanInterval: null,
    name: MOCK_PRICING_TIER_NAME,
    description: null,
    prices: [mockRawPricingPrice()],
    priceLabel: null,
    features: [
      { _key: MOCK_PRICING_FEATURE_KEY, text: MOCK_UNLIMITED_POSTS_FEATURE },
      {
        _key: MOCK_SECOND_PRICING_FEATURE_KEY,
        text: MOCK_PRIORITY_SUPPORT_FEATURE,
      },
    ],
    ctaButtons: null,
    highlightLabel: null,
    footnote: null,
    ...overrides,
  };
}

export function mockRawPricingModule(
  overrides: Partial<TRawPricingModule> = {},
): TRawPricingModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Pricing'),
    tiers: [
      mockRawPricingTier(),
      mockRawPricingTier({ _key: 'tier-2', name: 'Team' }),
    ],
    footnote: null,
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
