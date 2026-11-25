import {
  PLATFORM_PLAN_INTERVAL,
  PRICE_PERIOD,
  type TMaybeUndefined,
  type TPlatformPlanInterval,
  type TPricePeriod,
} from '@shinefold/config';
import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';
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

const PLATFORM_PLAN_INTERVAL_PERIODS: Record<
  TPlatformPlanInterval,
  TPricePeriod[]
> = {
  [PLATFORM_PLAN_INTERVAL.MONTH]: [PRICE_PERIOD.MONTH],
  [PLATFORM_PLAN_INTERVAL.YEAR]: [PRICE_PERIOD.YEAR],
  [PLATFORM_PLAN_INTERVAL.MONTH_AND_YEAR]: [
    PRICE_PERIOD.MONTH,
    PRICE_PERIOD.YEAR,
  ],
};

function toPlatformPlan({
  platformPlan,
  platformPlanInterval,
}: TRawPricingTier): TMaybeUndefined<TPricingTierPlatformPlan> {
  return platformPlan && platformPlanInterval
    ? {
        plan: platformPlan,
        periods: PLATFORM_PLAN_INTERVAL_PERIODS[platformPlanInterval],
      }
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    tiers: toPricingTiers(raw.tiers),
    footnote: raw.footnote ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
    ...toModuleAppearance(raw),
  };
}
