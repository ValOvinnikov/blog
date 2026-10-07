import type {
  TBrandVariant,
  TContentAlignment,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

export type TPostLatestModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
  displayMode: TDisplayMode;
};
