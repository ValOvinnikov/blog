import type {
  TBrandVariantOf,
  TContentAlignment,
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
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  questions: TFaqQuestion[];
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
