import { BRAND_VARIANT, LINK_TYPE, PRICE_PERIOD } from '@blog/config';
import {
  makeRawCtaButton,
  makeRawPricingModule,
  makeRawPricingPrice,
  makeRawPricingTier,
} from '@blog/service/testing/modules/fixtures';

import { toPricingModule } from './transformer';

describe('toPricingModule', () => {
  it('maps a full module', () => {
    const raw = makeRawPricingModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      footnote: 'Prices exclude VAT.',
      ctaButtons: [makeRawCtaButton()],
      contentAlignment: 'CENTER',
      tiers: [
        makeRawPricingTier({
          _key: 'tier-pro',
          name: 'Pro',
          description: 'For growing teams',
          prices: [
            makeRawPricingPrice({
              _key: 'price-month',
              period: PRICE_PERIOD.MONTH,
              amount: 29,
              compareAtAmount: 39,
              isStartingAt: true,
            }),
          ],
          priceLabel: null,
          features: ['Unlimited posts', 'Priority support'],
          ctaButtons: [makeRawCtaButton()],
          isHighlighted: true,
          highlightLabel: 'Most popular',
          footnote: 'Billed annually',
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.footnote).toBe('Prices exclude VAT.');
    expect(module.ctaButtons).toHaveLength(1);
    expect(module.contentAlignment).toBe('CENTER');
    expect(module.tiers).toEqual([
      {
        id: 'tier-pro',
        name: 'Pro',
        description: 'For growing teams',
        prices: [
          {
            period: PRICE_PERIOD.MONTH,
            amount: 29,
            compareAtAmount: 39,
            isStartingAt: true,
          },
        ],
        priceLabel: undefined,
        features: ['Unlimited posts', 'Priority support'],
        ctaButtons: module.tiers[0]?.ctaButtons,
        isHighlighted: true,
        highlightLabel: 'Most popular',
        footnote: 'Billed annually',
      },
    ]);
    expect(module.tiers[0]?.ctaButtons).toHaveLength(1);
  });

  it('keeps tiers in authored order', () => {
    const raw = makeRawPricingModule({
      tiers: [
        makeRawPricingTier({ _key: 'tier-1', name: 'Starter' }),
        makeRawPricingTier({ _key: 'tier-2', name: 'Pro' }),
        makeRawPricingTier({ _key: 'tier-3', name: 'Team' }),
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
      'Pro',
      'Team',
    ]);
  });

  it('folds a tier with no prices to an empty prices array', () => {
    const raw = makeRawPricingModule({
      tiers: [makeRawPricingTier({ prices: null })],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.prices).toEqual([]);
  });

  it('drops a tier button whose link cannot resolve', () => {
    const raw = makeRawPricingModule({
      tiers: [
        makeRawPricingTier({
          ctaButtons: [
            makeRawCtaButton({
              link: {
                label: 'Choose plan',
                linkType: LINK_TYPE.INTERNAL,
                url: null,
                internalReference: null,
                openInNewTab: null,
              },
            }),
          ],
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.ctaButtons).toEqual([]);
  });

  it('reports highlightLabel undefined when the tier is not highlighted', () => {
    const raw = makeRawPricingModule({
      tiers: [
        makeRawPricingTier({
          isHighlighted: false,
          highlightLabel: 'Most popular',
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.isHighlighted).toBe(false);
    expect(module.tiers[0]?.highlightLabel).toBeUndefined();
  });

  it('folds an absent isHighlighted/isStartingAt to false (genuine default)', () => {
    const raw = makeRawPricingModule({
      tiers: [
        makeRawPricingTier({
          isHighlighted: null,
          prices: [makeRawPricingPrice({ isStartingAt: null })],
        }),
      ],
    });

    const module = toPricingModule(raw);

    expect(module.tiers[0]?.isHighlighted).toBe(false);
    expect(module.tiers[0]?.prices[0]?.isStartingAt).toBe(false);
  });

  it('leaves footnote, contentAlignment and layout undefined when unset', () => {
    const raw = makeRawPricingModule({
      footnote: null,
      contentAlignment: null,
      layout: null,
    });

    const module = toPricingModule(raw);

    expect(module.footnote).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('returns an empty array for an absent module ctaButtons field', () => {
    const raw = makeRawPricingModule({ ctaButtons: null });

    const module = toPricingModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });
});
