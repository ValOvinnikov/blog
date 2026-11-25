import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TMaybeUndefined,
  TPricePeriod,
  TSellableTenantPlan,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

export type TPricingPrice = {
  period: TPricePeriod;
  amount: number;
  compareAtAmount: TMaybeUndefined<number>;
  isStartingAt: boolean;
};

export type TPricingTierPlatformPlan = {
  plan: TSellableTenantPlan;
  periods: TPricePeriod[];
};

export type TPricingTier = {
  id: string;
  platformPlan: TMaybeUndefined<TPricingTierPlatformPlan>;
  name: string;
  description: TMaybeUndefined<string>;
  prices: TPricingPrice[];
  priceLabel: TMaybeUndefined<string>;
  features: string[];
  ctaButtons: TCtaButton[];
  highlightLabel: TMaybeUndefined<string>;
  footnote: TMaybeUndefined<string>;
};

export type TPricingModule = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  tiers: TPricingTier[];
  footnote: TMaybeUndefined<string>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
