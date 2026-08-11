import type { TAppearance, TBrandVariant, TMaybeUndefined } from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TBrandVariant;
  title: string;
  posts: TPostCard[];
  appearance: TMaybeUndefined<TAppearance>;
};
