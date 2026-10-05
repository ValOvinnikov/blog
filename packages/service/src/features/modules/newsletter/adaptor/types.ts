import type {
  TBrandVariant,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TNewsletterVariant,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  variant: TNewsletterVariant;
  trustCues: TMaybeUndefined<string[]>;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
};
