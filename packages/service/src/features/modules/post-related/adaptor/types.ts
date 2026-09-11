import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';
import type { TRequiredHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostRelatedModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TRequiredHeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
};
