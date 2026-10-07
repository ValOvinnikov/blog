import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TFaqQuestion = {
  id: string;
  question: string;
  answer: TPortableTextBlock[];
};

export type TFaqModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  questions: TFaqQuestion[];
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TLayout>;
};
