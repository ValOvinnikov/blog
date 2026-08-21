import type {
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
  TSectionHeader,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  emptyMessage: TMaybeUndefined<string>;
  currentPage: number;
  totalPages: number;
};
