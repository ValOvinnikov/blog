import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TNewsletterVariant,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<string>;
  variant: TNewsletterVariant;
  trustCues: TMaybeUndefined<string[]>;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
};
