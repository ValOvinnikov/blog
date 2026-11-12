import type {
  TBrandVariant,
  TContentAlignmentOf,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@blog/service/shared/transformers/module/to-module-appearance';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

export type TPostListModule = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  posts: TPostCard[];
  layout: TMaybeUndefined<TWideLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  showImages: boolean;
  currentPage: number;
  totalPages: number;
};
