import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  makeRawPricingModule,
  makeRawPricingPrice,
  makeRawPricingTier,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { pricingModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const pricingDocument = {
  _id: 'pricing-1',
  _type: 'module_pricing',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({ [EN]: 'Plans', [NL]: 'Abonnementen' }),
  },
  tiers: [
    {
      _key: 'tier-pro',
      _type: 'pricingTier',
      name: localizedStrings({ [EN]: 'Pro', [NL]: 'Professioneel' }),
      description: localizedStrings({ [EN]: 'For growing teams' }),
      prices: [{ _key: 'price-1', period: 'MONTH', amount: 29 }],
      features: [
        {
          _key: 'feature-1',
          _type: 'pricingFeature',
          text: localizedStrings({
            [EN]: 'Unlimited posts',
            [NL]: 'Onbeperkt berichten',
          }),
        },
        {
          _key: 'feature-2',
          _type: 'pricingFeature',
          text: localizedStrings({ [EN]: 'Priority support' }),
        },
      ],
      highlightLabel: localizedStrings({
        [EN]: 'Most popular',
        [NL]: 'Populairst',
      }),
      footnote: localizedStrings({ [EN]: 'Billed annually' }),
    },
    {
      _key: 'tier-enterprise',
      _type: 'pricingTier',
      name: localizedStrings({ [EN]: 'Enterprise' }),
      priceLabel: localizedStrings({
        [EN]: 'Contact us',
        [NL]: 'Neem contact op',
      }),
    },
  ],
  footnote: localizedStrings({
    [EN]: 'Prices exclude VAT.',
    [NL]: 'Prijzen exclusief btw.',
  }),
};

async function runPricing(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    pricingModuleQuery.query,
    [document],
    undefined,
    { id: 'pricing-1', locale, defaultLocale: EN },
  );

  return pricingModuleQuery.parse(raw);
}

describe('pricingModuleQuery', () => {
  it('filters to module_pricing documents by id', () => {
    expect(pricingModuleQuery.query).toContain('_type == "module_pricing"');
    expect(pricingModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPricingModule(), headingBlock: null };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no tiers', () => {
    const raw = { ...makeRawPricingModule(), tiers: null };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a tier with no name', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [{ ...makeRawPricingTier(), name: null }],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('parses a tier with no prices', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [{ ...makeRawPricingTier(), prices: null }],
    };

    expect(() => pricingModuleQuery.parse(raw)).not.toThrow();
    expect(pricingModuleQuery.parse(raw).tiers?.[0]?.prices).toBeNull();
  });

  it('rejects a price with no period', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [
        {
          ...makeRawPricingTier(),
          prices: [{ ...makeRawPricingPrice(), period: null }],
        },
      ],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a price with no amount', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [
        {
          ...makeRawPricingTier(),
          prices: [{ ...makeRawPricingPrice(), amount: null }],
        },
      ],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('picks the heading, footnote and every tier text in the visitor language', async () => {
    const pricing = await runPricing(pricingDocument, NL);

    expect(pricing).toMatchObject({
      headingBlock: { heading: 'Abonnementen' },
      footnote: 'Prijzen exclusief btw.',
      tiers: [
        {
          name: 'Professioneel',
          description: 'For growing teams',
          features: [
            { _key: 'feature-1', text: 'Onbeperkt berichten' },
            { _key: 'feature-2', text: 'Priority support' },
          ],
          highlightLabel: 'Populairst',
          footnote: 'Billed annually',
        },
        { name: 'Enterprise', priceLabel: 'Neem contact op' },
      ],
    });
  });

  it('falls back to the default language for the heading, footnote and tiers', async () => {
    const pricing = await runPricing(pricingDocument, FR);

    expect(pricing).toMatchObject({
      headingBlock: { heading: 'Plans' },
      footnote: 'Prices exclude VAT.',
      tiers: [
        {
          name: 'Pro',
          features: [
            { _key: 'feature-1', text: 'Unlimited posts' },
            { _key: 'feature-2', text: 'Priority support' },
          ],
          highlightLabel: 'Most popular',
        },
        { name: 'Enterprise', priceLabel: 'Contact us' },
      ],
    });
  });

  it('fails when a tier name is missing in both languages', async () => {
    const [first, second] = pricingDocument.tiers;

    await expect(
      runPricing(
        {
          ...pricingDocument,
          tiers: [
            first,
            { ...second, name: localizedStrings({ [FR]: 'Entreprise' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
