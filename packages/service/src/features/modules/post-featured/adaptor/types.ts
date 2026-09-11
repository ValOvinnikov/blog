import type {
  TBrandVariantOf,
  TContentAlignment,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';
import type { TRequiredHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostFeaturedModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TRequiredHeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
  displayMode: TDisplayMode;
};
