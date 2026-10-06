import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';

export type TPostRelatedModuleDocument = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  limit: number;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
};
