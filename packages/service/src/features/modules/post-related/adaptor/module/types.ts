import type {
  TBrandVariant,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';

export type TPostRelatedModuleDocument = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  limit: number;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
};
