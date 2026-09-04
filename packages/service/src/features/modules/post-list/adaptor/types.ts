import type {
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
  TSectionHeader,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY' | 'BRAND_PRIMARY'>;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  currentPage: number;
  totalPages: number;
};
