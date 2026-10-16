import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';

export type TContactFormModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  successMessage: string;
  privacyNote: TMaybeUndefined<TPortableTextBlock[]>;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
};
