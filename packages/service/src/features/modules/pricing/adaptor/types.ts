import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TMaybeUndefined,
  TPricePeriod,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type TPricingPrice = {
  period: TPricePeriod;
  amount: number;
  compareAtAmount: TMaybeUndefined<number>;
  isStartingAt: boolean;
};

export type TPricingTier = {
  id: string;
  name: string;
  description: TMaybeUndefined<string>;
  prices: TPricingPrice[];
  priceLabel: TMaybeUndefined<string>;
  features: string[];
  ctaButtons: TCtaButton[];
  highlightLabel: TMaybeUndefined<string>;
  footnote: TMaybeUndefined<string>;
};

export type TPricingModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  tiers: TPricingTier[];
  footnote: TMaybeUndefined<string>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
