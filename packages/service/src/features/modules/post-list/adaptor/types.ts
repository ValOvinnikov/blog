import type {
  TFullBrandVariant,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
  TSectionHeader,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TFullBrandVariant;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<THeadingAlign>;
  currentPage: number;
  totalPages: number;
};
