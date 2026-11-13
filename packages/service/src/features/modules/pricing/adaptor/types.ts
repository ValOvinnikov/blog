import type {
  PricingTier,
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TMaybeUndefined,
  TPricePeriod,
  TSellableTenantPlan,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@blog/service/shared/transformers/module/to-module-appearance';

export type TPricingPrice = {
  period: TPricePeriod;
  amount: number;
  compareAtAmount: TMaybeUndefined<number>;
  isStartingAt: boolean;
};

export type TPricingTierPlatformPlan = {
  plan: TSellableTenantPlan;
  interval: NonNullable<PricingTier['platformPlanInterval']>;
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
