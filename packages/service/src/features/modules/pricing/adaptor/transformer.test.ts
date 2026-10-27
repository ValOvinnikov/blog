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
import { faker } from '@faker-js/faker';

import { toPricingModule } from './transformer';

faker.seed(6014);

const MOCK_PRICE_KEY = faker.string.uuid();
const MOCK_PRICE_AMOUNT = faker.number.int({ min: 10, max: 99 });
const MOCK_COMPARE_AT_AMOUNT = MOCK_PRICE_AMOUNT + 10;
const MOCK_THIRD_FEATURE_KEY = faker.string.uuid();
const MOCK_FIRST_TIER_KEY = faker.string.uuid();
const MOCK_SECOND_TIER_KEY = faker.string.uuid();
const MOCK_THIRD_TIER_KEY = faker.string.uuid();
const MOCK_FIRST_TIER_NAME = faker.lorem.word();
const MOCK_THIRD_TIER_NAME = faker.lorem.word();

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
              _key: MOCK_PRICE_KEY,
              period: PRICE_PERIOD.MONTH,
              amount: MOCK_PRICE_AMOUNT,
              compareAtAmount: MOCK_COMPARE_AT_AMOUNT,
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
    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
    expect(module.tiers).toEqual([
      {
        id: MOCK_PRICING_TIER_ID,
        name: MOCK_PRICING_TIER_NAME,
        description: MOCK_PRICING_TIER_DESCRIPTION,
        prices: [
          {
            period: PRICE_PERIOD.MONTH,
            amount: MOCK_PRICE_AMOUNT,
            compareAtAmount: MOCK_COMPARE_AT_AMOUNT,
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
            {
              _key: MOCK_THIRD_FEATURE_KEY,
              text: MOCK_PRIORITY_SUPPORT_FEATURE,
            },
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
        mockRawPricingTier({
          _key: MOCK_FIRST_TIER_KEY,
          name: MOCK_FIRST_TIER_NAME,
        }),
        mockRawPricingTier({
          _key: MOCK_SECOND_TIER_KEY,
          name: MOCK_PRICING_TIER_NAME,
        }),
        mockRawPricingTier({
          _key: MOCK_THIRD_TIER_KEY,
          name: MOCK_THIRD_TIER_NAME,
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers.map((tier) => tier.id)).toEqual([
      MOCK_FIRST_TIER_KEY,
      MOCK_SECOND_TIER_KEY,
      MOCK_THIRD_TIER_KEY,
    ]);
    expect(module.tiers.map((tier) => tier.name)).toEqual([
      MOCK_FIRST_TIER_NAME,
      MOCK_PRICING_TIER_NAME,
      MOCK_THIRD_TIER_NAME,
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

  it('treats a price with no starting-at flag as a fixed price', () => {
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

  it('leaves the optional footnote, alignment and layout undefined when unset', () => {
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
