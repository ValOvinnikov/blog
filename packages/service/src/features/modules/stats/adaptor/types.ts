import type {
  TBrandVariant,
  TContentAlignmentOf,
  TMaybeUndefined,
  THeadingBlock,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@shinefold/service/shared/transformers/layout/to-layout';

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
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
