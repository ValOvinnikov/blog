import type {
  TBrandVariant,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TStatItem = {
  id: string;
  value: string;
  label: string;
  description: TMaybeUndefined<string>;
};

export type TStatsModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  stats: TStatItem[];
  footnote: TMaybeUndefined<string>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
