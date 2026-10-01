import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { pricingModuleQuery } from './query';
import type { TPricingModule, TPricingPrice, TPricingTier } from './types';

export type TRawPricingModule = InferResultType<typeof pricingModuleQuery>;

function toPricingPrices(
  raw: TRawPricingModule['tiers'][number]['prices'],
): TPricingPrice[] {
  return (raw ?? []).map((price) => ({
    period: price.period,
    amount: price.amount,
    compareAtAmount: price.compareAtAmount ?? undefined,
    isStartingAt: price.isStartingAt ?? false,
  }));
}

function toPricingTiers(raw: TRawPricingModule['tiers']): TPricingTier[] {
  return raw.map((tier) => {
    const highlightLabel = tier.highlightLabel?.trim();
    const isHighlighted = Boolean(highlightLabel);

    return {
      id: tier._key,
      name: tier.name,
      description: tier.description ?? undefined,
      prices: toPricingPrices(tier.prices),
      priceLabel: tier.priceLabel ?? undefined,
      features: tier.features ?? [],
      ctaButtons: toCtaButtons(tier.ctaButtons),
      isHighlighted,
      highlightLabel: isHighlighted ? highlightLabel : undefined,
      footnote: tier.footnote ?? undefined,
    };
  });
}

export function toPricingModule(raw: TRawPricingModule): TPricingModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    tiers: toPricingTiers(raw.tiers),
    footnote: raw.footnote ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
