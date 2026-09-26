import type {
  TBrandVariantOf,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TPricePeriod,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

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
  isHighlighted: boolean;
  highlightLabel: TMaybeUndefined<string>;
  footnote: TMaybeUndefined<string>;
};

export type TPricingModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  tiers: TPricingTier[];
  footnote: TMaybeUndefined<string>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
