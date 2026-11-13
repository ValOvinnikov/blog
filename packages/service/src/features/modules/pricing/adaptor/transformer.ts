import type { TMaybeUndefined } from '@blog/config';
import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { pricingModuleQuery } from './query';
import type {
  TPricingModule,
  TPricingPrice,
  TPricingTier,
  TPricingTierPlatformPlan,
} from './types';

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

type TRawPricingTier = TRawPricingModule['tiers'][number];

function toPlatformPlan({
  platformPlan,
  platformPlanInterval,
}: TRawPricingTier): TMaybeUndefined<TPricingTierPlatformPlan> {
  return platformPlan && platformPlanInterval
    ? { plan: platformPlan, interval: platformPlanInterval }
    : undefined;
}

function toPricingTiers(raw: TRawPricingModule['tiers']): TPricingTier[] {
  return raw.map((tier) => {
    const platformPlan = toPlatformPlan(tier);

    return {
      id: tier._key,
      platformPlan,
      name: tier.name,
      description: tier.description ?? undefined,
      prices: platformPlan ? [] : toPricingPrices(tier.prices),
      priceLabel: platformPlan ? undefined : (tier.priceLabel ?? undefined),
      features: (tier.features ?? []).flatMap((feature) =>
        feature.text ? [feature.text] : [],
      ),
      ctaButtons: toCtaButtons(tier.ctaButtons),
      highlightLabel: tier.highlightLabel?.trim() || undefined,
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
