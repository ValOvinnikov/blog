import type {
  TAppearance,
  TBrandVariantOf,
  TMaybeUndefined,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  title: string;
  posts: TPostCard[];
  appearance: TMaybeUndefined<TAppearance>;
};
