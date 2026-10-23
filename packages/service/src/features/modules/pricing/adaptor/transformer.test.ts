import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  PRICE_PERIOD,
} from '@blog/config/constants';
import {
  MOCK_PRICING_FEATURE_KEY,
  MOCK_PRICING_FOOTNOTE,
  MOCK_PRICING_HIGHLIGHT_LABEL,
  MOCK_PRICING_TIER_DESCRIPTION,
  MOCK_PRICING_TIER_FOOTNOTE,
  MOCK_PRICING_TIER_ID,
  MOCK_PRICING_TIER_NAME,
  MOCK_PRIORITY_SUPPORT_FEATURE,
  MOCK_SECOND_PRICING_FEATURE_KEY,
  MOCK_UNLIMITED_POSTS_FEATURE,
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawPricingModule,
  mockRawPricingPrice,
  mockRawPricingTier,
} from '@blog/service/testing/modules/fixtures';

import { toPricingModule } from './transformer';

describe(toPricingModule, () => {
  it('maps a full module', () => {
    const raw = mockRawPricingModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      footnote: MOCK_PRICING_FOOTNOTE,
      ctaButtons: [mockRawCtaButton()],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      tiers: [
        mockRawPricingTier({
          _key: MOCK_PRICING_TIER_ID,
          name: MOCK_PRICING_TIER_NAME,
          description: MOCK_PRICING_TIER_DESCRIPTION,
          prices: [
            mockRawPricingPrice({
              _key: 'price-month',
              period: PRICE_PERIOD.MONTH,
              amount: 29,
              compareAtAmount: 39,
              isStartingAt: true,
            }),
          ],
          priceLabel: null,
          features: [
            {
              _key: MOCK_PRICING_FEATURE_KEY,
              text: MOCK_UNLIMITED_POSTS_FEATURE,
            },
            {
              _key: MOCK_SECOND_PRICING_FEATURE_KEY,
              text: MOCK_PRIORITY_SUPPORT_FEATURE,
            },
          ],
          ctaButtons: [mockRawCtaButton()],
          highlightLabel: MOCK_PRICING_HIGHLIGHT_LABEL,
          footnote: MOCK_PRICING_TIER_FOOTNOTE,
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.footnote).toBe(MOCK_PRICING_FOOTNOTE);
    expect(module.ctaButtons).toHaveLength(1);
    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
    expect(module.tiers).toEqual([
      {
        id: MOCK_PRICING_TIER_ID,
        name: MOCK_PRICING_TIER_NAME,
        description: MOCK_PRICING_TIER_DESCRIPTION,
        prices: [
          {
            period: PRICE_PERIOD.MONTH,
            amount: 29,
            compareAtAmount: 39,
            isStartingAt: true,
          },
        ],
        priceLabel: undefined,
        features: [MOCK_UNLIMITED_POSTS_FEATURE, MOCK_PRIORITY_SUPPORT_FEATURE],
        ctaButtons: [mockCtaButtonView()],
        highlightLabel: MOCK_PRICING_HIGHLIGHT_LABEL,
        footnote: MOCK_PRICING_TIER_FOOTNOTE,
      },
    ]);
  });

  it('drops a feature with no text in either language', () => {
    const raw = mockRawPricingModule({
      tiers: [
        mockRawPricingTier({
          features: [
            {
              _key: MOCK_PRICING_FEATURE_KEY,
              text: MOCK_UNLIMITED_POSTS_FEATURE,
            },
            { _key: MOCK_SECOND_PRICING_FEATURE_KEY, text: null },
            { _key: 'feature-3', text: MOCK_PRIORITY_SUPPORT_FEATURE },
          ],
        }),
      ],
    });

    expect(toPricingModule(raw).tiers[0]?.features).toEqual([
      MOCK_UNLIMITED_POSTS_FEATURE,
      MOCK_PRIORITY_SUPPORT_FEATURE,
    ]);
  });

  it('keeps tiers in authored order', () => {
    const raw = mockRawPricingModule({
      tiers: [
        mockRawPricingTier({ _key: 'tier-1', name: 'Starter' }),
        mockRawPricingTier({ _key: 'tier-2', name: MOCK_PRICING_TIER_NAME }),
        mockRawPricingTier({ _key: 'tier-3', name: 'Team' }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers.map((tier) => tier.id)).toEqual([
      'tier-1',
      'tier-2',
      'tier-3',
    ]);
    expect(module.tiers.map((tier) => tier.name)).toEqual([
      'Starter',
      MOCK_PRICING_TIER_NAME,
      'Team',
    ]);
  });

  it('folds a tier with no prices to an empty prices array', () => {
    const raw = mockRawPricingModule({
      tiers: [mockRawPricingTier({ prices: null })],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.prices).toEqual([]);
  });

  it('trims a padded highlight label', () => {
    const raw = mockRawPricingModule({
      tiers: [
        mockRawPricingTier({
          highlightLabel: `  ${MOCK_PRICING_HIGHLIGHT_LABEL} `,
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.highlightLabel).toBe(MOCK_PRICING_HIGHLIGHT_LABEL);
  });

  it.each([
    ['absent', null],
    ['only whitespace', '   '],
  ])('leaves the highlight label undefined when %s', (_, highlightLabel) => {
    const raw = mockRawPricingModule({
      tiers: [mockRawPricingTier({ highlightLabel })],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.highlightLabel).toBeUndefined();
  });

  it('folds an absent isStartingAt to false', () => {
    const raw = mockRawPricingModule({
      tiers: [
        mockRawPricingTier({
          prices: [mockRawPricingPrice({ isStartingAt: null })],
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.prices[0]?.isStartingAt).toBe(false);
  });

  it('leaves footnote, contentAlignment and layout undefined when unset', () => {
    const raw = mockRawPricingModule({
      footnote: null,
      contentAlignment: null,
      layout: null,
    });

    const module = toPricingModule(raw);

    expect(module.footnote).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });
});
