import type {
  TBrandVariant,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TSectionPagesModuleDocument = {
  brandVariant: TBrandVariant;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
