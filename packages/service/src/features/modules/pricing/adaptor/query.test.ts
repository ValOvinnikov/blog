import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  PRICE_PERIOD,
} from '@blog/config/constants';
import {
  MOCK_PRICING_FEATURE_KEY,
  MOCK_PRICING_FOOTNOTE,
  MOCK_PRICING_HIGHLIGHT_LABEL,
  MOCK_PRICING_MODULE_ID,
  MOCK_PRICING_TIER_DESCRIPTION,
  MOCK_PRICING_TIER_FOOTNOTE,
  MOCK_PRICING_TIER_ID,
  MOCK_PRICING_TIER_NAME,
  MOCK_PRIORITY_SUPPORT_FEATURE,
  MOCK_SECOND_PRICING_FEATURE_KEY,
  MOCK_UNLIMITED_POSTS_FEATURE,
  mockRawPricingModule,
  mockRawPricingPrice,
  mockRawPricingTier,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { pricingModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TIER_TYPE = 'pricingTier';
const FEATURE_TYPE = 'pricingFeature';
faker.seed(6014);

const MOCK_ENGLISH_HEADING = faker.lorem.words(2);
const MOCK_DUTCH_HEADING = faker.lorem.words(2);
const MOCK_DUTCH_TIER_NAME = faker.lorem.word();
const MOCK_ENTERPRISE_TIER_NAME = faker.lorem.word();
const MOCK_FRENCH_ENTERPRISE_TIER_NAME = faker.lorem.word();
const MOCK_DUTCH_UNLIMITED_POSTS = faker.lorem.words(2);
const MOCK_DUTCH_MOST_POPULAR = faker.lorem.word();
const MOCK_CONTACT_US = faker.lorem.words(2);
const MOCK_DUTCH_CONTACT_US = faker.lorem.words(2);
const MOCK_DUTCH_VAT_FOOTNOTE = faker.lorem.sentence();
const MOCK_PRICE_KEY = faker.string.uuid();
const MOCK_ENTERPRISE_TIER_KEY = faker.string.uuid();

const MOCK_PRICING_DOCUMENT = {
  _id: MOCK_PRICING_MODULE_ID,
  _type: 'module_pricing',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_ENGLISH_HEADING,
    [NL]: MOCK_DUTCH_HEADING,
  }),
  tiers: [
    {
      _key: MOCK_PRICING_TIER_ID,
      _type: TIER_TYPE,
      name: mockLocalizedStrings({
        [EN]: MOCK_PRICING_TIER_NAME,
        [NL]: MOCK_DUTCH_TIER_NAME,
      }),
      description: mockLocalizedStrings({
        [EN]: MOCK_PRICING_TIER_DESCRIPTION,
      }),
      prices: [
        { _key: MOCK_PRICE_KEY, period: PRICE_PERIOD.MONTH, amount: 29 },
      ],
      features: [
        {
          _key: MOCK_PRICING_FEATURE_KEY,
          _type: FEATURE_TYPE,
          text: mockLocalizedStrings({
            [EN]: MOCK_UNLIMITED_POSTS_FEATURE,
            [NL]: MOCK_DUTCH_UNLIMITED_POSTS,
          }),
        },
        {
          _key: MOCK_SECOND_PRICING_FEATURE_KEY,
          _type: FEATURE_TYPE,
          text: mockLocalizedStrings({ [EN]: MOCK_PRIORITY_SUPPORT_FEATURE }),
        },
      ],
      highlightLabel: mockLocalizedStrings({
        [EN]: MOCK_PRICING_HIGHLIGHT_LABEL,
        [NL]: MOCK_DUTCH_MOST_POPULAR,
      }),
      footnote: mockLocalizedStrings({ [EN]: MOCK_PRICING_TIER_FOOTNOTE }),
    },
    {
      _key: MOCK_ENTERPRISE_TIER_KEY,
      _type: TIER_TYPE,
      name: mockLocalizedStrings({ [EN]: MOCK_ENTERPRISE_TIER_NAME }),
      priceLabel: mockLocalizedStrings({
        [EN]: MOCK_CONTACT_US,
        [NL]: MOCK_DUTCH_CONTACT_US,
      }),
    },
  ],
  footnote: mockLocalizedStrings({
    [EN]: MOCK_PRICING_FOOTNOTE,
    [NL]: MOCK_DUTCH_VAT_FOOTNOTE,
  }),
};

async function runPricing(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    pricingModuleQuery.query,
    [document],
    undefined,
    { id: MOCK_PRICING_MODULE_ID, locale, defaultLocale: EN },
  );

  return pricingModuleQuery.parse(raw);
}

describe('pricingModuleQuery', () => {
  it.each([
    ['a module with no headingBlock', { headingBlock: null }],
    ['a module with no tiers', { tiers: null }],
    [
      'a tier with no name',
      { tiers: [{ ...mockRawPricingTier(), name: null }] },
    ],
    [
      'a price with no period',
      {
        tiers: [
          {
            ...mockRawPricingTier(),
            prices: [{ ...mockRawPricingPrice(), period: null }],
          },
        ],
      },
    ],
    [
      'a price with no amount',
      {
        tiers: [
          {
            ...mockRawPricingTier(),
            prices: [{ ...mockRawPricingPrice(), amount: null }],
          },
        ],
      },
    ],
  ])('rejects %s', (_, overrides) => {
    const raw = { ...mockRawPricingModule(), ...overrides };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('parses a tier with no prices', () => {
    const raw = {
      ...mockRawPricingModule(),
      tiers: [{ ...mockRawPricingTier(), prices: null }],
    };

    expect(pricingModuleQuery.parse(raw).tiers?.[0]?.prices).toBeNull();
  });

  it('picks the heading, footnote and every tier text in the visitor language', async () => {
    const pricing = await runPricing(MOCK_PRICING_DOCUMENT, NL);

    expect(pricing).toMatchObject({
      headingBlock: { heading: MOCK_DUTCH_HEADING },
      footnote: MOCK_DUTCH_VAT_FOOTNOTE,
      tiers: [
        {
          name: MOCK_DUTCH_TIER_NAME,
          description: MOCK_PRICING_TIER_DESCRIPTION,
          features: [
            {
              _key: MOCK_PRICING_FEATURE_KEY,
              text: MOCK_DUTCH_UNLIMITED_POSTS,
            },
            {
              _key: MOCK_SECOND_PRICING_FEATURE_KEY,
              text: MOCK_PRIORITY_SUPPORT_FEATURE,
            },
          ],
          highlightLabel: MOCK_DUTCH_MOST_POPULAR,
          footnote: MOCK_PRICING_TIER_FOOTNOTE,
        },
        { name: MOCK_ENTERPRISE_TIER_NAME, priceLabel: MOCK_DUTCH_CONTACT_US },
      ],
    });
  });

  it('falls back to the default language for the heading, footnote and tiers', async () => {
    const pricing = await runPricing(MOCK_PRICING_DOCUMENT, FR);

    expect(pricing).toMatchObject({
      headingBlock: { heading: MOCK_ENGLISH_HEADING },
      footnote: MOCK_PRICING_FOOTNOTE,
      tiers: [
        {
          name: MOCK_PRICING_TIER_NAME,
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
          highlightLabel: MOCK_PRICING_HIGHLIGHT_LABEL,
        },
        { name: MOCK_ENTERPRISE_TIER_NAME, priceLabel: MOCK_CONTACT_US },
      ],
    });
  });

  it('fails when a tier name is missing in both languages', async () => {
    const [first, second] = MOCK_PRICING_DOCUMENT.tiers;

    await expect(
      runPricing(
        {
          ...MOCK_PRICING_DOCUMENT,
          tiers: [
            first,
            {
              ...second,
              name: mockLocalizedStrings({
                [FR]: MOCK_FRENCH_ENTERPRISE_TIER_NAME,
              }),
            },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
