import type {
  TBrandVariantOf,
  TContentAlignment,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostLatestModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
  displayMode: TDisplayMode;
};
