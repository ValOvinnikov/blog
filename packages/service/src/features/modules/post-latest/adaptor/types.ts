import type {
  TBrandVariantOf,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
  TSectionHeader,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostLatestModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<THeadingAlign>;
};
