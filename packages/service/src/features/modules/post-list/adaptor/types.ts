import type {
  TFullBrandVariant,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TFullBrandVariant;
  headingBlock: THeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
  currentPage: number;
  totalPages: number;
};
