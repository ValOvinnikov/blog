import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { TModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

export type TFaqQuestion = {
  id: string;
  question: string;
  answer: TPortableTextBlock[];
};

export type TFaqModule = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  questions: TFaqQuestion[];
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TLayout>;
};
