import type {
  TBrandVariant,
  TContentAlignmentOf,
  TDisplayMode,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

export type TPostFeaturedModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TWideLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  showImages: boolean;
  displayMode: TDisplayMode;
};
