import type {
  TBrandVariantOf,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TChildPagesModuleDocument = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
